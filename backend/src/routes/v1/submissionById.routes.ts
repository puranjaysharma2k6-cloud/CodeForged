import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getSubmissionById } from '../../controllers/submission.controller.js';

const router = Router();

// GET /api/submissions/:submissionId
router.get('/:submissionId', authenticate, getSubmissionById);

export default router;
