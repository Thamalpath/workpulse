import { validateBody } from "../middleware/validation.middleware.js";

export const validateCreateReport = validateBody({
  weekStartDate: [{ required: true, message: "Week start date is required." }, { isString: true }],
  weekEndDate: [{ required: true, message: "Week end date is required." }, { isString: true }],
  tasks: [{ isArray: true, message: "Tasks must be an array." }],
  nextWeekTasks: [{ isArray: true, message: "Next week tasks must be an array." }],
  blockers: [{ isArray: true, message: "Blockers must be an array." }],
  achievements: [{ isArray: true, message: "Achievements must be an array." }],
  hoursWorked: [{ isArray: true, message: "Hours worked must be an array." }],
});

export const validateCreateProject = validateBody({
  name: [{ required: true, message: "Project name is required." }, { isString: true }],
  key: [{ required: true, message: "Project key is required." }, { isString: true }],
});
