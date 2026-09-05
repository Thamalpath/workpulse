import { Router } from "express";

import {
  getPermission,
  getPermissions,
  patchPermission,
  postPermission,
  removePermission,
} from "../controllers/permission.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  validateCreatePermission,
  validateUpdatePermission,
} from "../validators/permission.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));

router.get("/", requirePermission(PERMISSIONS.PERMISSION_VIEW), getPermissions);
router.get("/:id", requirePermission(PERMISSIONS.PERMISSION_VIEW), getPermission);
router.post("/", requirePermission(PERMISSIONS.PERMISSION_CREATE), validateCreatePermission, postPermission);
router.patch("/:id", requirePermission(PERMISSIONS.PERMISSION_UPDATE), validateUpdatePermission, patchPermission);
router.delete("/:id", requirePermission(PERMISSIONS.PERMISSION_DELETE), removePermission);

export default router;