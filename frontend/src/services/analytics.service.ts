import { api } from "@/lib/api";

export type SummaryMetrics = {
  totalSubmittedThisPeriod: number;
  compliance: {
    totalExpected: number;
    submittedCount: number;
    pendingCount: number;
    lateCount: number;
    complianceRate: number;
  };
  needsCorrectionCount: number;
  blockers: {
    totalBlockers: number;
    criticalBlockers: number;
  };
};

export type TasksTrendPoint = {
  weekStartDate: string;
  weekEndDate: string;
  label: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  notStartedTasks: number;
  avgPlannedPercent: number;
  avgActualPercent: number;
  totalHoursPlanned: number;
  totalHoursSpent: number;
};

export type MemberStatusPoint = {
  userId: string;
  userName: string;
  approved: number;
  submitted: number;
  needsCorrection: number;
  draft: number;
  notStarted: number;
  totalReports: number;
  completedTasks: number;
  totalHours: number;
};

export type ProjectWorkloadPoint = {
  projectId: string | null;
  projectName: string;
  taskCount: number;
  completedTasks: number;
  totalHours: number;
  reportCount: number;
};

export type CategoryTimePoint = {
  category: string;
  hours: number;
  percentage: number;
};

export type ActivityItem = {
  id: string;
  reportId: string;
  eventType: "submission" | "approved" | "request_correction";
  actorName: string;
  targetUserName: string;
  projectName: string | null;
  weekStartDate: string;
  weekEndDate: string;
  comment: string | null;
  timestamp: string;
};

export type AnalyticsOverview = {
  from: string;
  to: string;
  summary: SummaryMetrics;
  tasksTrend: TasksTrendPoint[];
  memberStatus: MemberStatusPoint[];
  projectWorkload: ProjectWorkloadPoint[];
  categoryTime: CategoryTimePoint[];
  recentActivity: ActivityItem[];
};

export function getAnalyticsOverview(filters: {
  from?: string;
  to?: string;
  memberId?: string;
  projectId?: string;
} = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.memberId && filters.memberId !== "all") {
    params.set("memberId", filters.memberId);
  }
  if (filters.projectId && filters.projectId !== "all") {
    params.set("projectId", filters.projectId);
  }

  const qs = params.toString();
  return api.get<AnalyticsOverview>(`/api/analytics/overview${qs ? `?${qs}` : ""}`);
}
