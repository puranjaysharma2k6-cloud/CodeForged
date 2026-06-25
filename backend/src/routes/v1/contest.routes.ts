import { Router } from "express";
import {
  getContestById,
  getParticipation,
  listContests,
  registerForContest,
} from "../../controllers/contest.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public
router.get("/", listContests);
router.get("/:id", getContestById);

// Protected - require valid JWT
router.get("/:id/participation", authenticate, getParticipation);
router.post("/:id/register", authenticate, registerForContest);

export default router;
