import { Router } from "express";

import {
  getContestById,
  registerForContest,
  getContestArena,
} from "../../controllers/contest.controller.js";

const router = Router({mergeParams : true});

//router.get("/:id/participation", authenticate, getParticipation);
router.post("/register",registerForContest);
router.get("/arena",getContestArena);

export default router;