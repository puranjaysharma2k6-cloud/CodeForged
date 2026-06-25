import { Router } from "express";
import {getLeaderboard } from "../../controllers/leaderboard.controller.js"
import { getUser } from "../../controllers/user.controller.js";
const router = Router();



router.get("/",getLeaderboard);
router.get("/:id",getUser);
export default router;