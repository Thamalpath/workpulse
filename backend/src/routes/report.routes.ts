import { Router } from "express";

import {
  getMyReports,
  getAllReports,
  getReport,
  postReport,
  patchReport,
  removeReport,
  submitReport,
  getProjects,
  postProject,
  removeProject,
} from "../controllers/report.controller.js";
import { reviewReport } from "../controllers/review.controller.js";
import {
  getVersionDetail,
  getVersions,
} from "../controllers/reportVersion.controller.js";
import { authenticate, requirePermission, requireRole } from "../middleware/auth.middleware.js";
import { validateCreateReport, validateCreateProject } from "../validators/report.validator.js";
import { validateReview } from "../validators/review.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));

router.get("/my", getMyReports);
router.get("/", requirePermission(PERMISSIONS.REPORT_VIEW_ALL), getAllReports);
router.get("/projects", getProjects);
router.post("/projects", requireRole("admin", "manager"), validateCreateProject, postProject);
router.delete("/projects/:id", requireRole("admin", "manager"), removeProject);

router.get("/:id", getReport);
router.post("/", requirePermission(PERMISSIONS.REPORT_CREATE), validateCreateReport, postReport);
router.patch("/:id", requirePermission(PERMISSIONS.REPORT_EDIT), validateCreateReport, patchReport);
router.delete("/:id", removeReport);

router.post("/:id/submit", requirePermission(PERMISSIONS.REPORT_SUBMIT), submitReport);
router.post("/:id/review", requirePermission(PERMISSIONS.REPORT_APPROVE), validateReview, reviewReport);
router.get("/:id/versions", getVersions);
router.get("/:id/versions/:versionId", getVersionDetail);

export default router;