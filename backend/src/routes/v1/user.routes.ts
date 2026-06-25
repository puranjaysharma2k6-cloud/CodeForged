import { Router,Request,Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getUser } from "../../controllers/user.controller.js";

 const router = Router();
 
// GET /api/users/:id
router.get("/me",authenticate,getUser)
router.get("/:id", authenticate,getUser)


export default router;