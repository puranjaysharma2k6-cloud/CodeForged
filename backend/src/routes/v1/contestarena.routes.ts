import { Router } from "express";

import {
  registerForContest,
  getContestArena,
  getContestRegistration,
  getContestLeaderboard,
} from "../../controllers/contest.controller.js";
import submissionRoutes from "./submission.routes.js";
const router = Router({mergeParams : true});

//router.get("/:id/participation", authenticate, getParticipation);
router.post("/register",registerForContest);
router.get("/registration", getContestRegistration);
router.get("/arena",getContestArena);
router.get("/leaderboard", getContestLeaderboard);
router.use("/problems", submissionRoutes);
export default router;
