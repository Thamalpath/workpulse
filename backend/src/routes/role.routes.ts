import { Router } from "express";

import {
  getAssignments,
  getPermissions,
  getRole,
  getRoles,
  patchRole,
  patchRolePermissions,
  postRole,
  removeRole,
} from "../controllers/role.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  validateCreateRole,
  validateRolePermissions,
  validateUpdateRole,
} from "../validators/role.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));

router.get(
  "/assignments",
  requirePermission(PERMISSIONS.ASSIGN_VIEW),
  getAssignments
);
router.get(
  "/permissions",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  getPermissions
);
router.get(
  "/",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  getRoles
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  getRole
);
router.post(
  "/",
  requirePermission(PERMISSIONS.ROLE_CREATE),
  validateCreateRole,
  postRole
);
router.patch(
  "/:id/permissions",
  requirePermission(PERMISSIONS.ASSIGN_MANAGE),
  validateRolePermissions,
  patchRolePermissions
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_UPDATE),
  validateUpdateRole,
  patchRole
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_DELETE),
  removeRole
);

export default router;
