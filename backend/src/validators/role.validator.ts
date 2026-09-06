import { validateBody } from "../middleware/validation.middleware.js";

export const validateCreateRole = validateBody({
  name: [
    { required: true, message: "Role name is required." },
    { isString: true },
    { minLength: 2, message: "Role name must be at least 2 characters." },
  ],
  key: [
    { required: true, message: "Role key is required." },
    { isString: true },
    {
      pattern: /^[a-z][a-z0-9-]*$/,
      message: "Role key must start with a letter and only contain lowercase letters, numbers and dashes.",
    },
  ],
  description: { isString: true },
});

export const validateUpdateRole = validateBody({
  name: {
    optional: true,
    isString: true,
    minLength: 2,
    message: "Role name must be at least 2 characters.",
  },
  description: { optional: true, isString: true },
  permissionIds: { optional: true, isStringArray: true },
});