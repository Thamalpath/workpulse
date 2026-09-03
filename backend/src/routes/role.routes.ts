import { Router } from "express";

import {
  getPermissions,
  getRole,
  getRoles,
  patchRole,
  postRole,
  removeRole,
} from "../controllers/role.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  validateCreateRole,
  validateUpdateRole,
} from "../validators/role.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));

router.get(
  "/",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  getRoles
);
router.get(
  "/permissions",
  requirePermission(PERMISSIONS.ROLE_VIEW),
  getPermissions
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
