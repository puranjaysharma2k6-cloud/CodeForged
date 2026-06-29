import { Router } from "express";
import {
  getContestById,
  getprevContests,
  getLatestContests,
  registerForContest,
} from "../../controllers/contest.controller.js";
import contestArena from "./contestarena.routes.js";
import { authenticate } from "../../middlewares/auth.middleware.js";


const router = Router({ mergeParams: true });

// Public
router.get("/past", getprevContests);
router.get("/upcoming",getLatestContests);
router.use("/:id",authenticate,contestArena);


export default router;
