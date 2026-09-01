import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { singleImage } from "../middleware/upload.js";
const router = Router();
router.post("/event-banner", requireAuth, singleImage, uploadImage);
export default router;
