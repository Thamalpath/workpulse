import { validateBody } from "../middleware/validation.middleware.js";

export const validateCreateRole = validateBody({
  name: [{ required: true, message: "Role name is required." }, { isString: true }],
  key: [
    { required: true, message: "Role key is required." },
    { isString: true },
  ],
  description: { isString: true },
});

export const validateUpdateRole = validateBody({
  name: { isString: true },
  description: { isString: true },
});
