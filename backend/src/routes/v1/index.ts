import { Router } from "express";
import authRoutes from "./auth.routes.js";
import contestRoutes from "./contest.routes.js";
import userRoutes from "./user.routes.js";
import leaderboardRoutes from "./leaderboard.routes.js"
import { authenticate } from "../../middlewares/auth.middleware.js";
const router = Router();

router.use("/auth",authRoutes);
router.use("/contests", contestRoutes);
router.use("/users", userRoutes);
router.use("/leaderboard",authenticate,leaderboardRoutes);

export default router;
