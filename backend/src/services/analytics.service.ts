import { query } from "../config/database.js";
import { PERMISSIONS } from "../constants/permissions.js";

function toDateString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = value as Date;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toId(value: string | number): string {
  return String(value);
}

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

export async function getAnalyticsOverview(filters: {
  from?: string | undefined;
  to?: string | undefined;
  memberId?: string | undefined;
  projectId?: string | undefined;
}): Promise<AnalyticsOverview> {
  const now = new Date();
  const defaultTo = toDateString(now);
  // Default to 8 weeks ago
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const defaultFrom = toDateString(eightWeeksAgo);

  const from = filters.from || defaultFrom;
  const to = filters.to || defaultTo;

  const [
    summary,
    tasksTrend,
    memberStatus,
    projectWorkload,
    categoryTime,
    recentActivity,
  ] = await Promise.all([
    fetchSummaryMetrics(from, to, filters.projectId),
    fetchTasksTrend(from, to, filters.memberId, filters.projectId),
    fetchMemberStatusDistribution(from, to, filters.projectId),
    fetchProjectWorkload(from, to, filters.memberId),
    fetchTimeSpentByCategory(from, to, filters.memberId, filters.projectId),
    fetchRecentActivity(20),
  ]);

  return {
    from,
    to,
    summary,
    tasksTrend,
    memberStatus,
    projectWorkload,
    categoryTime,
    recentActivity,
  };
}

async function fetchSummaryMetrics(
  from: string,
  to: string,
  projectId?: string,
): Promise<SummaryMetrics> {
  const where = ["wr.weekStartDate BETWEEN ? AND ?"];
  const params: unknown[] = [from, to];
  if (projectId) {
    where.push("wr.projectId = ?");
    params.push(projectId);
  }

  // 1. Total submitted & needs correction
  const reportRows = (await query(
    `SELECT
       COUNT(DISTINCT wr.id) as totalReports,
       SUM(CASE WHEN wr.status IN ('submitted', 'approved') THEN 1 ELSE 0 END) as submittedOrApproved,
       SUM(CASE WHEN wr.status = 'needs_correction' THEN 1 ELSE 0 END) as needsCorrection,
       COUNT(DISTINCT wr.userId) as submittedUsers
     FROM WeeklyReport wr
     WHERE ${where.join(" AND ")}`,
    params,
  )) as Record<string, unknown>[];

  const totalSubmittedThisPeriod = Number(reportRows[0]?.submittedOrApproved ?? 0) + Number(reportRows[0]?.needsCorrection ?? 0);
  const needsCorrectionCount = Number(reportRows[0]?.needsCorrection ?? 0);

  // 2. Active roster members count
  const rosterRows = (await query(
    `SELECT COUNT(DISTINCT u.id) as totalRoster
     FROM User u
     JOIN UserRole ur ON ur.userId = u.id
     JOIN Role r ON r.id = ur.roleId
     JOIN RolePermission rp ON rp.roleId = r.id
     JOIN Permission p ON p.id = rp.permissionId
     WHERE u.isActive = 1 AND p.\`key\` = ?
       AND u.id NOT IN (
         SELECT ur2.userId FROM UserRole ur2
         JOIN Role r2 ON r2.id = ur2.roleId
         WHERE r2.\`key\` = 'admin'
       )`,
    [PERMISSIONS.REPORT_SUBMIT],
  )) as Record<string, unknown>[];

  const totalExpected = Number(rosterRows[0]?.totalRoster ?? 0);
  const submittedCount = Number(reportRows[0]?.submittedUsers ?? 0);

  const todayStr = toDateString(new Date());
  const isPeriodClosed = to < todayStr;
  const unsubmitted = Math.max(0, totalExpected - submittedCount);
  const pendingCount = isPeriodClosed ? 0 : unsubmitted;
  const lateCount = isPeriodClosed ? unsubmitted : 0;
  const complianceRate =
    totalExpected > 0 ? Math.round((submittedCount / totalExpected) * 100) : 0;

  // 3. Open blockers
  const blockerRows = (await query(
    `SELECT
       COUNT(rb.id) as totalBlockers,
       SUM(CASE WHEN rb.isKeyIssue = 1 THEN 1 ELSE 0 END) as criticalBlockers
     FROM ReportBlocker rb
     JOIN WeeklyReport wr ON wr.id = rb.reportId
     WHERE ${where.join(" AND ")}`,
    params,
  )) as Record<string, unknown>[];

  const totalBlockers = Number(blockerRows[0]?.totalBlockers ?? 0);
  const criticalBlockers = Number(blockerRows[0]?.criticalBlockers ?? 0);

  return {
    totalSubmittedThisPeriod,
    compliance: {
      totalExpected,
      submittedCount,
      pendingCount,
      lateCount,
      complianceRate,
    },
    needsCorrectionCount,
    blockers: {
      totalBlockers,
      criticalBlockers,
    },
  };
}

async function fetchTasksTrend(
  from: string,
  to: string,
  memberId?: string,
  projectId?: string,
): Promise<TasksTrendPoint[]> {
  const where = ["wr.weekStartDate BETWEEN ? AND ?"];
  const params: unknown[] = [from, to];
  if (memberId) {
    where.push("wr.userId = ?");
    params.push(memberId);
  }
  if (projectId) {
    where.push("wr.projectId = ?");
    params.push(projectId);
  }

  const rows = (await query(
    `SELECT
       wr.weekStartDate,
       wr.weekEndDate,
       COUNT(rt.id) as totalTasks,
       SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
       SUM(CASE WHEN rt.status = 'in_progress' THEN 1 ELSE 0 END) as inProgressTasks,
       SUM(CASE WHEN rt.status = 'blocked' THEN 1 ELSE 0 END) as blockedTasks,
       SUM(CASE WHEN rt.status = 'not_started' THEN 1 ELSE 0 END) as notStartedTasks,
       AVG(rt.plannedPercent) as avgPlannedPercent,
       AVG(rt.actualPercent) as avgActualPercent,
       SUM(rt.timePlanned) as totalHoursPlanned,
       SUM(rt.timeSpent) as totalHoursSpent
     FROM WeeklyReport wr
     LEFT JOIN ReportTask rt ON rt.reportId = wr.id
     WHERE ${where.join(" AND ")}
     GROUP BY wr.weekStartDate, wr.weekEndDate
     ORDER BY wr.weekStartDate ASC`,
    params,
  )) as Record<string, unknown>[];

  return rows.map((r) => {
    const sDate = toDateString(r.weekStartDate);
    const eDate = toDateString(r.weekEndDate);
    const sObj = new Date(sDate);
    const label = `${sObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    return {
      weekStartDate: sDate,
      weekEndDate: eDate,
      label,
      totalTasks: Number(r.totalTasks ?? 0),
      completedTasks: Number(r.completedTasks ?? 0),
      inProgressTasks: Number(r.inProgressTasks ?? 0),
      blockedTasks: Number(r.blockedTasks ?? 0),
      notStartedTasks: Number(r.notStartedTasks ?? 0),
      avgPlannedPercent: Math.round(Number(r.avgPlannedPercent ?? 0)),
      avgActualPercent: Math.round(Number(r.avgActualPercent ?? 0)),
      totalHoursPlanned: Math.round(Number(r.totalHoursPlanned ?? 0)),
      totalHoursSpent: Math.round(Number(r.totalHoursSpent ?? 0)),
    };
  });
}

async function fetchMemberStatusDistribution(
  from: string,
  to: string,
  projectId?: string,
): Promise<MemberStatusPoint[]> {
  // 1. Get active roster members
  const roster = (await query(
    `SELECT DISTINCT u.id, u.name, u.email
     FROM User u
     JOIN UserRole ur ON ur.userId = u.id
     JOIN Role r ON r.id = ur.roleId
     JOIN RolePermission rp ON rp.roleId = r.id
     JOIN Permission p ON p.id = rp.permissionId
     WHERE u.isActive = 1 AND p.\`key\` = ?
       AND u.id NOT IN (
         SELECT ur2.userId FROM UserRole ur2
         JOIN Role r2 ON r2.id = ur2.roleId
         WHERE r2.\`key\` = 'admin'
       )
     ORDER BY u.name ASC`,
    [PERMISSIONS.REPORT_SUBMIT],
  )) as { id: string | number; name: string; email: string }[];

  const where = ["wr.weekStartDate BETWEEN ? AND ?"];
  const params: unknown[] = [from, to];
  if (projectId) {
    where.push("wr.projectId = ?");
    params.push(projectId);
  }

  // 2. Query reports and tasks for this period
  const subClause = ["wr2.weekStartDate BETWEEN ? AND ?"];
  const subParams: unknown[] = [from, to];
  if (projectId) {
    subClause.push("wr2.projectId = ?");
    subParams.push(projectId);
  }
  const subSql = subClause.join(" AND ");
  const rows = (await query(
    `SELECT
       wr.userId,
       SUM(CASE WHEN wr.status = 'approved' THEN 1 ELSE 0 END) as approvedCount,
       SUM(CASE WHEN wr.status = 'submitted' THEN 1 ELSE 0 END) as submittedCount,
       SUM(CASE WHEN wr.status = 'needs_correction' THEN 1 ELSE 0 END) as needsCorrectionCount,
       SUM(CASE WHEN wr.status = 'draft' THEN 1 ELSE 0 END) as draftCount,
       COUNT(DISTINCT wr.id) as totalReports,
       (SELECT COUNT(*) FROM ReportTask rt WHERE rt.reportId IN (
          SELECT id FROM WeeklyReport wr2 WHERE wr2.userId = wr.userId AND ${subSql}
        ) AND rt.status = 'completed') as completedTasks,
       (SELECT COALESCE(SUM(rh.hours), 0) FROM ReportHoursWorked rh WHERE rh.reportId IN (
          SELECT id FROM WeeklyReport wr2 WHERE wr2.userId = wr.userId AND ${subSql}
        )) as totalHours
     FROM WeeklyReport wr
     WHERE ${where.join(" AND ")}
     GROUP BY wr.userId`,
    [...params, ...subParams, ...subParams],
  )) as Record<string, unknown>[];

  const map = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    map.set(toId(r.userId as string | number), r);
  }

  return roster.map((member) => {
    const id = toId(member.id);
    const data = map.get(id);
    const approved = Number(data?.approvedCount ?? 0);
    const submitted = Number(data?.submittedCount ?? 0);
    const needsCorrection = Number(data?.needsCorrectionCount ?? 0);
    const draft = Number(data?.draftCount ?? 0);
    const totalReports = Number(data?.totalReports ?? 0);
    const notStarted = totalReports === 0 ? 1 : 0;
    const completedTasks = Number(data?.completedTasks ?? 0);
    const totalHours = Math.round(Number(data?.totalHours ?? 0));

    return {
      userId: id,
      userName: member.name,
      approved,
      submitted,
      needsCorrection,
      draft,
      notStarted,
      totalReports,
      completedTasks,
      totalHours,
    };
  });
}

async function fetchProjectWorkload(
  from: string,
  to: string,
  memberId?: string,
): Promise<ProjectWorkloadPoint[]> {
  const where = ["wr.weekStartDate BETWEEN ? AND ?"];
  const params: unknown[] = [from, to];
  if (memberId) {
    where.push("wr.userId = ?");
    params.push(memberId);
  }

  const rows = (await query(
    `SELECT
       p.id as projectId,
       COALESCE(p.name, 'General / No Project') as projectName,
       COUNT(DISTINCT wr.id) as reportCount,
       COUNT(rt.id) as taskCount,
       SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
       (
         SELECT COALESCE(SUM(rh.hours), 0)
         FROM ReportHoursWorked rh
         JOIN WeeklyReport wr_h ON wr_h.id = rh.reportId
         WHERE (wr_h.projectId = p.id OR (p.id IS NULL AND wr_h.projectId IS NULL))
           AND ${where.join(" AND ").replace(/wr\./g, "wr_h.")}
       ) as totalHours
     FROM WeeklyReport wr
     LEFT JOIN Project p ON p.id = wr.projectId
     LEFT JOIN ReportTask rt ON rt.reportId = wr.id
     WHERE ${where.join(" AND ")}
     GROUP BY p.id, p.name
     ORDER BY totalHours DESC, taskCount DESC`,
    [...params, ...params],
  )) as Record<string, unknown>[];

  return rows.map((r) => ({
    projectId: r.projectId != null ? toId(r.projectId as string | number) : null,
    projectName: String(r.projectName),
    reportCount: Number(r.reportCount ?? 0),
    taskCount: Number(r.taskCount ?? 0),
    completedTasks: Number(r.completedTasks ?? 0),
    totalHours: Math.round(Number(r.totalHours ?? 0)),
  }));
}

async function fetchTimeSpentByCategory(
  from: string,
  to: string,
  memberId?: string,
  projectId?: string,
): Promise<CategoryTimePoint[]> {
  const where = ["wr.weekStartDate BETWEEN ? AND ?"];
  const params: unknown[] = [from, to];
  if (memberId) {
    where.push("wr.userId = ?");
    params.push(memberId);
  }
  if (projectId) {
    where.push("wr.projectId = ?");
    params.push(projectId);
  }

  const rows = (await query(
    `SELECT
       rh.category,
       SUM(rh.hours) as totalHours
     FROM ReportHoursWorked rh
     JOIN WeeklyReport wr ON wr.id = rh.reportId
     WHERE ${where.join(" AND ")} AND rh.category IS NOT NULL AND rh.category != ''
     GROUP BY rh.category
     ORDER BY totalHours DESC`,
    params,
  )) as Record<string, unknown>[];

  const grandTotal = rows.reduce(
    (sum, r) => sum + Number(r.totalHours ?? 0),
    0,
  );

  return rows.map((r) => {
    const hours = Math.round(Number(r.totalHours ?? 0) * 10) / 10;
    const percentage =
      grandTotal > 0 ? Math.round((hours / grandTotal) * 100) : 0;
    return {
      category: String(r.category),
      hours,
      percentage,
    };
  });
}

async function fetchRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const safeLimit = Math.max(1, Math.floor(Number(limit) || 20));
  // Fetch recent review actions
  const reviewRows = (await query(
    `SELECT
       rr.id,
       rr.reportId,
       rr.action as eventType,
       rr.comment,
       rr.createdAt as timestamp,
       reviewer.name as actorName,
       targetUser.name as targetUserName,
       p.name as projectName,
       wr.weekStartDate,
       wr.weekEndDate
     FROM ReportReview rr
     JOIN WeeklyReport wr ON wr.id = rr.reportId
     JOIN User reviewer ON reviewer.id = rr.reviewerId
     JOIN User targetUser ON targetUser.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ORDER BY rr.createdAt DESC
     LIMIT ${safeLimit}`,
    [],
  )) as Record<string, unknown>[];

  // Fetch recent submissions
  const submissionRows = (await query(
    `SELECT
       wr.id,
       wr.id as reportId,
       'submission' as eventType,
       wr.notes as comment,
       wr.updatedAt as timestamp,
       u.name as actorName,
       u.name as targetUserName,
       p.name as projectName,
       wr.weekStartDate,
       wr.weekEndDate
     FROM WeeklyReport wr
     JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     WHERE wr.status = 'submitted'
     ORDER BY wr.updatedAt DESC
     LIMIT ${safeLimit}`,
    [],
  )) as Record<string, unknown>[];

  const combined = [...reviewRows, ...submissionRows].map((r) => ({
    id: toId(r.id as string | number),
    reportId: toId(r.reportId as string | number),
    eventType: r.eventType as ActivityItem["eventType"],
    actorName: String(r.actorName),
    targetUserName: String(r.targetUserName),
    projectName: r.projectName ? String(r.projectName) : null,
    weekStartDate: toDateString(r.weekStartDate),
    weekEndDate: toDateString(r.weekEndDate),
    comment: r.comment ? String(r.comment) : null,
    timestamp: new Date(r.timestamp as Date).toISOString(),
  }));

  combined.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return combined.slice(0, limit);
}
