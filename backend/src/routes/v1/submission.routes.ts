import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { submitSolution } from '../../controllers/submission.controller.js';

const router = Router({ mergeParams: true });

// POST /api/contests/:contestId/problems/:problemId/submit
router.post('/:problemId/submit', submitSolution);

export default router;
