import { Router } from "express";

import {
  getProjects,
  getProject,
  postProject,
  patchProject,
  removeProject,
  putProjectMembers,
} from "../controllers/project.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  validateCreateProject,
  validateUpdateProject,
  validateMembers,
} from "../validators/project.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));

router.get("/", requirePermission(PERMISSIONS.PROJECT_VIEW), getProjects);
router.get("/:id", requirePermission(PERMISSIONS.PROJECT_VIEW), getProject);

router.post("/", requirePermission(PERMISSIONS.PROJECT_MANAGE), validateCreateProject, postProject);
router.patch("/:id", requirePermission(PERMISSIONS.PROJECT_MANAGE), validateUpdateProject, patchProject);
router.delete("/:id", requirePermission(PERMISSIONS.PROJECT_MANAGE), removeProject);
router.put("/:id/members", requirePermission(PERMISSIONS.PROJECT_MANAGE), validateMembers, putProjectMembers);

export default router;