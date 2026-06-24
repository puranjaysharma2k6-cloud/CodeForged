import { Router } from "express";
import authRoutes from "./auth.routes.js";
import contestRoutes from "./contest.routes.js";

const router = Router();

router.use(authRoutes);
router.use("/contests", contestRoutes);

export default router;
