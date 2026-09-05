import { validateBody } from "../middleware/validation.middleware.js";

export const validateReview = validateBody({
  action: [
    { required: true, message: "Review action is required." },
    { isString: true },
  ],
});