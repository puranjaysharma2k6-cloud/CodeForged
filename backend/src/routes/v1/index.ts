import { Router } from "express";
import authRoutes from "./auth.routes.js";
import contestRoutes from "./contest.routes.js";
import userRoutes from "./user.routes.js";
import leaderboardRoutes from "./leaderboard.routes.js";
import submissionRoutes from "./submission.routes.js";
import submissionByIdRoutes from "./submissionById.routes.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use("/auth",        authRoutes);
router.use("/contests",    contestRoutes);
router.use("/users",       userRoutes);
router.use("/leaderboard", authenticate, leaderboardRoutes);

// POST /api/contests/:contestId/problems/:problemId/submit
// GET  /api/contests/:contestId/problems/:problemId/submissions
router.use("/contests/:contestId/problems", submissionRoutes);

// GET  /api/submissions/:submissionId
router.use("/submissions",authenticate,submissionByIdRoutes);

export default router;
