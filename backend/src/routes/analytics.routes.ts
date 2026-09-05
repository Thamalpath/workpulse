import { Router } from "express";
import { getOverview } from "../controllers/analytics.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));
router.use(requirePermission(PERMISSIONS.REPORT_VIEW_ALL));

router.get("/overview", getOverview);

export default router;
