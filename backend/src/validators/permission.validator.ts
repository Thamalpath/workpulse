import { validateBody } from "../middleware/validation.middleware.js";

export const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;

export const validateCreatePermission = validateBody({
  name: [
    { required: true, message: "Permission name is required." },
    { isString: true },
    { minLength: 2, message: "Permission name must be at least 2 characters." },
  ],
  key: [
    { required: true, message: "Permission key is required." },
    { isString: true },
    {
      pattern: PERMISSION_KEY_PATTERN,
      message:
        'Permission key must be in the form "module.action" (e.g. "report.view").',
    },
  ],
  module: [
    { required: true, message: "Module is required." },
    { isString: true },
  ],
  description: { isString: true, optional: true },
});

export const validateUpdatePermission = validateBody({
  name: {
    isString: true,
    minLength: 2,
    message: "Permission name must be at least 2 characters.",
  },
  key: [
    { isString: true },
    {
      pattern: PERMISSION_KEY_PATTERN,
      message:
        'Permission key must be in the form "module.action" (e.g. "report.view").',
    },
  ],
  module: { isString: true },
  description: { isString: true, optional: true },
});