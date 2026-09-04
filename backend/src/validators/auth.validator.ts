import { validateBody } from "../middleware/validation.middleware.js";

export const validateRegister = validateBody({
  name: [{ required: true, message: "Name is required." }, { isString: true }],
  email: [
    { required: true, message: "Email is required." },
    { isEmail: true, message: "Please provide a valid email address." },
  ],
  username: [
    { required: true, message: "Username is required." },
    { isString: true },
    { minLength: 3, message: "Username must be at least 3 characters." },
  ],
  password: [
    { required: true, message: "Password is required." },
    { minLength: 4, message: "Password must be at least 4 characters." },
  ],
});

export const validateLogin = validateBody({
  identifier: { required: true, message: "Username or email is required." },
  password: { required: true, message: "Password is required." },
});

export const validateChangePassword = validateBody({
  currentPassword: { required: true, message: "Current password is required." },
  newPassword: [
    { required: true, message: "New password is required." },
    { minLength: 4, message: "New password must be at least 4 characters." },
  ],
});
