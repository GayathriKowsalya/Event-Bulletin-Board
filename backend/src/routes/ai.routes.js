import { Router } from "express";
import { parseEvent, moderateEvent, recommendations } from "../controllers/ai.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
const router = Router();
router.post("/events/parse", requireAuth, parseEvent);
router.post("/events/moderate", requireAuth, moderateEvent);
router.get("/events/recommendations", optionalAuth, recommendations);
export default router;
