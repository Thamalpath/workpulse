import { validateBody } from "../middleware/validation.middleware.js";

export const validateCreateUser = validateBody({
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
    { minLength: 6, message: "Password must be at least 6 characters." },
  ],
  roleIds: [
    { isStringArray: true, message: "roleIds must be an array of role IDs." },
  ],
});

export const validateUpdateUser = validateBody({
  name: { isString: true },
  password: { minLength: 6, message: "Password must be at least 6 characters." },
  roleIds: [{ isStringArray: true, message: "roleIds must be an array of role IDs." }],
});
