import { validateBody } from "../middleware/validation.middleware.js";

export const validateCreateProject = validateBody({
  name: [
    { required: true, message: "Project name is required." },
    { isString: true },
    { minLength: 2, message: "Project name must be at least 2 characters." },
  ],
  key: [
    { required: true, message: "Project key is required." },
    { isString: true },
    { minLength: 2, message: "Project key must be at least 2 characters." },
  ],
  description: { optional: true, isString: true },
});

export const validateUpdateProject = validateBody({
  name: { optional: true, isString: true, minLength: 2, message: "Project name must be at least 2 characters." },
  key: { optional: true, isString: true, minLength: 2, message: "Project key must be at least 2 characters." },
  description: { optional: true, isString: true },
  isActive: { optional: true, isBoolean: true, message: "isActive must be a boolean." },
});

export const validateMembers = validateBody({
  userIds: [
    { required: true, message: "userIds is required." },
    { isStringArray: true, message: "Team member IDs must be provided as an array." },
  ],
});