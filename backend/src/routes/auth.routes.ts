import { Router } from "express";

import {
  changePassword,
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  validateChangePassword,
  validateLogin,
  validateRegister,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", authenticate(false), logout);
router.get("/me", authenticate(true), me);
router.put("/change-password", authenticate(true), validateChangePassword, changePassword);

export default router;
