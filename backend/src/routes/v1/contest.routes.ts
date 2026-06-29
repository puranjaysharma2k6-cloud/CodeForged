import { Router } from "express";
import {
  getContestById,
  getprevContests,
  getLatestContests,
  getContestRegistration,
  registerForContest,
} from "../../controllers/contest.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public
router.get("/past", getprevContests);
router.get("/upcoming",getLatestContests);
router.get("/:id/registration", authenticate, getContestRegistration);
router.get("/:id", authenticate,getContestById);

// Protected - require valid JWT
//router.get("/:id/participation", authenticate, getParticipation);
router.post("/:id/register", authenticate, registerForContest);


export default router;
