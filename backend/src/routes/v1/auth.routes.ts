import { Router } from "express";
import {
  login,
  refresh,
  register,
} from "../../controllers/auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public
router.post("/login",    login);
router.post("/register", register);
// NOTE: /api/refresh (root-level) is the canonical refresh endpoint used by the
// frontend. This path exists only for clients that call /api/auth/refresh.
router.post("/refresh",  refresh);

export default router;
