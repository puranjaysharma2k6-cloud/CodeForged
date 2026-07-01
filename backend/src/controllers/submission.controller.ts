import type { Request, Response } from 'express';
import { prisma } from '../db/db.js';
import { SupportedLanguage } from '../judge-module/judge/types.js';
import { Verdict } from '../generated/prisma/enums.js';

// submissionQueue is initialised in index.ts and injected here at boot
// We use a late-binding ref so the controller file can be imported before
// the queue is ready (circular import safety).
let _queue: { enqueue: (r: any) => Promise<void> } | null = null;

export function setSubmissionQueue(q: { enqueue: (r: any) => Promise<void> }): void {
  _queue = q;
}

// Maps frontend language strings to SupportedLanguage enum
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  'cpp17':      SupportedLanguage.CPP17,
  'cpp20':      SupportedLanguage.CPP20,
  'java':       SupportedLanguage.JAVA,
  'python3':    SupportedLanguage.PYTHON3,
  'javascript': SupportedLanguage.JAVASCRIPT,
  'go':         SupportedLanguage.GO,
  'rust':       SupportedLanguage.RUST,
  'kotlin':     SupportedLanguage.KOTLIN,
  // also accept the enum values directly (e.g. "CPP17")
  'CPP17':      SupportedLanguage.CPP17,
  'CPP20':      SupportedLanguage.CPP20,
  'JAVA':       SupportedLanguage.JAVA,
  'PYTHON3':    SupportedLanguage.PYTHON3,
  'JAVASCRIPT': SupportedLanguage.JAVASCRIPT,
  'GO':         SupportedLanguage.GO,
  'RUST':       SupportedLanguage.RUST,
  'KOTLIN':     SupportedLanguage.KOTLIN,
};

/**
 * POST /api/contests/:contestId/problems/:problemId/submit
 *
 * 1. Validates the contest is live (time-based, not status column)
 * 2. Validates the problem belongs to the contest
 * 3. Validates the problem has a vjudgeId set
 * 4. Creates a Submission row with status PENDING
 * 5. Enqueues it for judging — returns { submissionId } immediately
 */
export async function submitSolution(req: Request, res: Response): Promise<void> {
  const contestId  = req.params.contestId  as string;
  const problemId  = req.params.problemId  as string;
  const userId     = req.user?.userId;
  const { sourceCode, language } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (!sourceCode || typeof sourceCode !== 'string' || sourceCode.trim().length === 0) {
    res.status(400).json({ error: 'sourceCode is required.' });
    return;
  }

  const mappedLanguage = LANGUAGE_MAP[language];
  if (!mappedLanguage) {
    res.status(400).json({
      error: `Unsupported language "${language}". Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
    });
    return;
  }

  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { startTime: true, duration: true, status: true },
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found.' });
      return;
    }

    const now     = new Date();
    const endTime = new Date(contest.startTime.getTime() + contest.duration * 60 * 1000);

    if (now < contest.startTime) {
      res.status(403).json({ error: 'Contest has not started yet.' });
      return;
    }

    if (now >= endTime) {
      res.status(403).json({ error: 'Contest has ended. Submissions are closed.' });
      return;
    }

    const problem = await prisma.problem.findFirst({
      where: { id: problemId, contestId},
      select: { id: true, vjudgeId: true },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found in this contest.' });
      return;
    }

    if (!problem.vjudgeId) {
      res.status(503).json({ error: 'This problem is not yet configured for judging.' });
      return;
    }

    const registration = await prisma.contestRegistration.findFirst({
      where: { userId, contestId },
    });

    if (!registration) {
      res.status(403).json({ error: 'You are not registered for this contest.' });
      return;
    }

    // ── 5. Create submission row ──────────────────────────────────────
    const submission = await prisma.submission.create({
      data: {
        code:      sourceCode,
        language:  mappedLanguage,
        status:    Verdict.PENDING,
        userId,
        problemId,
      },
    });

    // 6. Enqueue for judging rplace with bullmq queues for future scaling
    if (!_queue) {
      res.status(503).json({ error: 'Judge service not available.' });
      return;
    }

    await _queue.enqueue({
      submissionId: submission.id,
      problemId,
      language:     mappedLanguage,
      sourceCode,
      contextId:    contestId,
    });

    // Return submissionId — frontend uses this to subscribe to verdict via WS
    res.status(202).json({ submissionId: submission.id });

  } catch (err) {
    console.error('[submit] error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/contests/:contestId/problems/:problemId/submissions
 * Returns the current user's submission history for a problem.
 */
export async function getSubmissions(req: Request, res: Response): Promise<void> {
  const contestId = req.params.contestId as string;
  const problemId = req.params.problemId as string;
  const userId    = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: { userId, problemId },
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        language:  true,
        status:    true,
        runtime:   true,
        memory:    true,
        createdAt: true,
      },
    });

    res.status(200).json({ submissions });
  } catch (err) {
    console.error('[submissions] error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/submissions/:submissionId
 * Returns the full submission including code and verdict.
 * Only the owner can view their own submission.
 */
export async function getSubmissionById(req: Request, res: Response): Promise<void> {
  const submissionId = req.params.submissionId as string;
  const userId       = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId as string},
      select: {
        id:        true,
        code:      true,
        language:  true,
        status:    true,
        runtime:   true,
        memory:    true,
        createdAt: true,
        userId:    true,
        problemId: true,
      },
    });

    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    if (submission.userId !== userId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.status(200).json({ submission });
  } catch (err) {
    console.error('[submission] error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
