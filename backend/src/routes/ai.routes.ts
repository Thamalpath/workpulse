import { Router } from "express";

import { postChat } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateChat } from "../validators/ai.validator.js";

const router = Router();

router.use(authenticate(true));

router.post("/chat", validateChat, postChat);

export default router;
