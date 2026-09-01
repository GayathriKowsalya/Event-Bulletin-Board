import { Router } from "express";
import { checkRegistration, registerForEvent, rsvp, unregister } from "../controllers/registration.controller.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/:id/registration", requireAuth, checkRegistration);
router.post("/:id/register", requireAuth, registerForEvent);
router.post("/:id/rsvp", requireAuth, rsvp);
router.delete("/:id/rsvp", requireAuth, unregister);
export default router;
