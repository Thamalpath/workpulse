import { api } from "@/lib/api";

export type ReportStatus = "draft" | "submitted" | "needs_correction" | "approved";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type NextWeekTaskStatus = "not_started" | "in_progress" | "completed";

export type ReportTask = {
  taskName: string;
  priority: TaskPriority;
  plannedPercent: number;
  actualPercent: number;
  status: TaskStatus;
  timePlanned?: number;
  timeSpent?: number;
  deliverable?: string;
};

export type NextWeekTask = {
  taskName: string;
  priority: TaskPriority;
  status: NextWeekTaskStatus;
};

export type Blocker = {
  description: string;
  isKeyIssue: boolean;
};

export type Achievement = {
  description: string;
  isKeyAchievement: boolean;
};

export type HoursWorked = {
  category: string;
  hours: number;
};

export type Report = {
  id: string;
  userId: string;
  projectId: string | null;
  weekStartDate: string;
  weekEndDate: string;
  status: ReportStatus;
  versionNumber: number;
  notes: string | null;
  userName: string;
  projectName: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: ReportTask[];
  nextWeekTasks?: NextWeekTask[];
  blockers?: Blocker[];
  achievements?: Achievement[];
  hoursWorked?: HoursWorked[];
  reviews?: ReportReview[];
  versions?: ReportVersionMeta[];
};

export type ReviewAction = "approved" | "request_correction";

export type ReportReview = {
  id: string;
  reportId: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  comment: string | null;
  versionId: string;
  versionNumber: number;
  createdAt: string;
};

export type ReportVersionMeta = {
  id: string;
  reportId: string;
  versionNumber: number;
  projectId: string | null;
  weekStartDate: string;
  weekEndDate: string;
  notes: string | null;
  projectName: string | null;
  createdAt: string;
};

export type ReportVersionDetail = ReportVersionMeta & {
  tasks: ReportTask[];
  nextWeekTasks: NextWeekTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hoursWorked: HoursWorked[];
};

export type CreateReportInput = {
  projectId?: string;
  weekStartDate: string;
  weekEndDate: string;
  notes?: string;
  tasks: ReportTask[];
  nextWeekTasks: NextWeekTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  hoursWorked: HoursWorked[];
};

export type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  isActive: boolean;
};

export function getMyReports() {
  return api.get<Report[]>("/api/reports/my");
}

export function getAllReports() {
  return api.get<Report[]>("/api/reports");
}

export function getReport(id: string) {
  return api.get<Report>(`/api/reports/${id}`);
}

export function createReport(data: CreateReportInput) {
  return api.post<Report>("/api/reports", data);
}

export function updateReport(id: string, data: CreateReportInput) {
  return api.patch<Report>(`/api/reports/${id}`, data);
}

export function deleteReport(id: string) {
  return api.delete(`/api/reports/${id}`);
}

export function submitReport(id: string) {
  return api.post<Report>(`/api/reports/${id}/submit`);
}

export function reviewReport(id: string, action: ReviewAction, comment?: string) {
  return api.post<Report>(`/api/reports/${id}/review`, {
    action,
    ...(comment !== undefined ? { comment } : {}),
  });
}

export function getReportVersions(id: string) {
  return api.get<ReportVersionMeta[]>(`/api/reports/${id}/versions`);
}

export function getReportVersion(reportId: string, versionId: string) {
  return api.get<ReportVersionDetail>(`/api/reports/${reportId}/versions/${versionId}`);
}

export function getProjects() {
  return api.get<Project[]>("/api/reports/projects");
}

export function createProject(data: { name: string; key: string; description?: string }) {
  return api.post<Project>("/api/reports/projects", data);
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_correction: "Needs Correction",
  approved: "Approved",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  needs_correction: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
};
