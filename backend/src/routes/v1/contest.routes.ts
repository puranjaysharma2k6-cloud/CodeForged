import { Router } from "express";
import {
  getprevContests,
  getLatestContests,
} from "../../controllers/contest.controller.js";
import contestArena from "./contestarena.routes.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

// Public
router.get("/past",     getprevContests);
router.get("/upcoming", getLatestContests);

// All /:id sub-routes (arena, register, leaderboard, submissions)
router.use("/:id", authenticate, contestArena);

export default router;
