/**
 * GET /api/users/:id/weak-topics
 *
 * Returns the user's top-5 weak topics (Wilson-scored) plus an
 * LLM-generated coaching sentence (cached, with deterministic fallback).
 *
 * Auth: the requesting user can only fetch their own stats.
 * (Extend to allow public profiles later if needed.)
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getWeakTopics } from './summaryService.js';

const router = Router({ mergeParams: true });

router.get('/:id/weak-topics', authenticate, async (req: Request, res: Response) => {
  const targetUserId    = req.params.id as string;
  const requestingUserId = req.user?.userId;

  if (!requestingUserId) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (targetUserId !== requestingUserId) {
    res.status(403).json({ error: 'You can only view your own weak topics.' });
    return;
  }

  try {
    const result = await getWeakTopics(targetUserId);
    res.status(200).json(result);
  } catch (err) {
    console.error('[weak-topics] route error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
