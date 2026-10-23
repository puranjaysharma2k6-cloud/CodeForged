import { Router } from "express";
import authRoutes        from "./auth.routes.js";
import contestRoutes     from "./contest.routes.js";
import userRoutes        from "./user.routes.js";
import leaderboardRoutes from "./leaderboard.routes.js";
import { authenticate }  from "../../middlewares/auth.middleware.js";
import { handleJudge0Webhook } from '../../judge/judge0.js';
import { refresh }       from '../../controllers/auth.controller.js';

const router      = Router();
const webhookRouter = Router();

webhookRouter.put('/webhook', async (req, res) => {
  try {
    await handleJudge0Webhook(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[judge0-webhook] error', err);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

router.use("/auth",        authRoutes);
// Canonical token-refresh endpoint called by fetchwithAuth
router.post("/refresh",    refresh);
router.use("/contests",    contestRoutes);
router.use("/users",       userRoutes);
router.use("/leaderboard", authenticate, leaderboardRoutes);
router.use('/judge0',      webhookRouter);

export default router;
