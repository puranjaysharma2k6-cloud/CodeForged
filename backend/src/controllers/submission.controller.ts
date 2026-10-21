import type { Request, Response } from 'express';
import { prisma } from '../db/db.js';
import { Verdict } from '../generated/prisma/enums.js';
import { submitToJudge0, submitBatchToJudge0 } from '../judge/judge0.js';

export enum SupportedLanguage {
  CPP17 = 'cpp17',
  CPP20 = 'cpp20',
  JAVA = 'java',
  PYTHON3 = 'python3',
  JAVASCRIPT = 'javascript',
  GO = 'go',
  RUST = 'rust',
  KOTLIN = 'kotlin',
}
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  'cpp17':      SupportedLanguage.CPP17,
  'cpp20':      SupportedLanguage.CPP20,
  'java':       SupportedLanguage.JAVA,
  'python3':    SupportedLanguage.PYTHON3,
  'javascript': SupportedLanguage.JAVASCRIPT,
  'go':         SupportedLanguage.GO,
  'rust':       SupportedLanguage.RUST,
  'kotlin':     SupportedLanguage.KOTLIN,
  'CPP17':      SupportedLanguage.CPP17,
  'CPP20':      SupportedLanguage.CPP20,
  'JAVA':       SupportedLanguage.JAVA,
  'PYTHON3':    SupportedLanguage.PYTHON3,
  'JAVASCRIPT': SupportedLanguage.JAVASCRIPT,
  'GO':         SupportedLanguage.GO,
  'RUST':       SupportedLanguage.RUST,
  'KOTLIN':     SupportedLanguage.KOTLIN,
};


export async function submitSolution(req: Request, res: Response): Promise<void> {
  const contestId  = req.params.id  as string;
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

  const mappedLanguage = normalizeLanguage(language);
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
     
    if(contest.status=="ONGOING"){

     const registration = await prisma.contestRegistration.findFirst({
      where: { userId, contestId },
    });

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

   

    if (!registration) {
      res.status(403).json({ error: 'You are not registered for this contest.' });
      return;
    }
  }
  else if(contest.status=="PAST"){
     const registration = await prisma.contestRegistration.findFirst({
      where: { userId, contestId },
      orderBy : {registeredAt: 'desc'},select : {registeredAt : true,mode : true},
    });
         if (!registration) {
      res.status(403).json({ error: 'You are not registered for this contest.' });
      return;
    }
        const now     = new Date();
    const endTime = new Date(registration?.registeredAt.getTime() + contest.duration * 60 * 1000);
   
  

    if (now >= endTime) {
      res.status(403).json({ error: 'Contest has ended. Submissions are closed.' });
      return;
    }

  }
    const problem = await prisma.problem.findFirst({
      where: { id: problemId, contestId  },
      select: {
        id: true,
        timeLimit: true,
        memoryLimit: true,
        testCases: {
          orderBy: { orderIndex: 'asc' },
          select: { input: true, expected: true, orderIndex: true },
        },
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found in this contest.' });
      return;
    }

    const submission = await prisma.submission.create({
      data: {
        code:      sourceCode,
        language:  mappedLanguage,
        status:    Verdict.PENDING,
        userId,
        problemId,
      },
    });

    const testCases = problem.testCases.length > 0 ? problem.testCases : [{ input: '', expected: '', orderIndex: 0 }];
    const testResults = testCases.map((_, index) => ({
        index,
        verdict: Verdict.PENDING,
        runtime: null,
        memory: null,
      }));

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: Verdict.PENDING,
        testResults,
      },
    });

    const testsPayload = testCases.map((testCase, index) => ({
      stdin: testCase.input,
      expectedOutput: testCase.expected,
      testIndex: index,
    }));

    await submitBatchToJudge0({
      sourceCode,
      language: mappedLanguage,
      timeLimitMs: problem.timeLimit,
      memoryLimitKb: Math.max(32 * 1024, problem.memoryLimit * 1024),
      submissionId: submission.id,
      tests: testsPayload,
    });

    res.status(202).json({ submissionId: submission.id, verdict: Verdict.PENDING });
  } catch (err) {
    console.error('[submit] error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

function normalizeLanguage(language: unknown): SupportedLanguage | null {
  if (typeof language !== 'string') return null;

  const normalized = language.trim().toLowerCase();
  switch (normalized) {
    case 'cpp':
    case 'cpp17':
      return SupportedLanguage.CPP17;
    case 'cpp20':
      return SupportedLanguage.CPP20;
    case 'java':
      return SupportedLanguage.JAVA;
    case 'python':
    case 'python3':
      return SupportedLanguage.PYTHON3;
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      return SupportedLanguage.JAVASCRIPT;
    case 'go':
      return SupportedLanguage.GO;
    case 'rust':
      return SupportedLanguage.RUST;
    case 'kotlin':
      return SupportedLanguage.KOTLIN;
    default:
      return null;
  }
}
