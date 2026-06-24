import { Router } from "express";
import {
  getMe,
  login,
  refresh,
  register,
} from "../../controllers/auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public auth routes — match frontend fetch paths (/api/login, /api/register)
router.post("/login", login);
router.post("/register", register);
router.post("/refresh", refresh);

// Protected auth routes
router.get("/me", authenticate, getMe);

export default router;
