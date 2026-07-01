import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  submitSolution,
  getSubmissions,
  getSubmissionById,
} from '../../controllers/submission.controller.js';

const router = Router({ mergeParams: true });

// POST /api/contests/:contestId/problems/:problemId/submit
router.post('/:problemId/submit', authenticate, submitSolution);

// GET  /api/contests/:contestId/problems/:problemId/submissions
router.get('/:problemId/submissions', authenticate, getSubmissions);

export default router;
