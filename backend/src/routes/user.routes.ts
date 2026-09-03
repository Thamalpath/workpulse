import { Router } from "express";

import {
  getUser,
  getUsers,
  patchUser,
  postUser,
  removeUser,
} from "../controllers/user.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../validators/user.validator.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.use(authenticate(true));

router.get(
  "/",
  requirePermission(PERMISSIONS.USER_VIEW),
  getUsers
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.USER_VIEW),
  getUser
);
router.post(
  "/",
  requirePermission(PERMISSIONS.USER_CREATE),
  validateCreateUser,
  postUser
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.USER_UPDATE),
  validateUpdateUser,
  patchUser
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.USER_DELETE),
  removeUser
);

export default router;
