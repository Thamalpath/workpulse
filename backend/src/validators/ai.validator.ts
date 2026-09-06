import { validateBody } from "../middleware/validation.middleware.js";

export const validateChat = validateBody({
  messages: [{ required: true, message: "Messages are required." }, { isArray: true, message: "Messages must be an array." }],
});
