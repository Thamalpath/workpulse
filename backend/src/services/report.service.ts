import { query, withTransaction, type RowDataPacket, type TransactionExec } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { listReportVersions } from "./reportVersion.service.js";

export type ReportStatus = "draft" | "submitted" | "needs_correction" | "approved";

type ReportRow = {
  id: string | number;
  userId: string | number;
  projectId: string | number | null;
  weekStartDate: string;
  weekEndDate: string;
  status: ReportStatus;
  versionNumber: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  projectName: string | null;
};

type QueryRunner = {
  rows: <T extends RowDataPacket[]>(sql: string, params?: unknown[]) => Promise<T>;
};

const defaultRunner: QueryRunner = {
  rows: <T extends RowDataPacket[]>(sql: string, params?: unknown[]) => query<T>(sql, params),
};

type TaskRow = {
  id: string | number;
  reportId: string | number;
  taskName: string;
  priority: "low" | "medium" | "high" | "critical";
  plannedPercent: number;
  actualPercent: number;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  timePlanned: number | null;
  timeSpent: number | null;
  deliverable: string | null;
  sortOrder: number;
};

type NextWeekTaskRow = {
  id: string | number;
  reportId: string | number;
  taskName: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "not_started" | "in_progress" | "completed";
  sortOrder: number;
};

type BlockerRow = {
  id: string | number;
  reportId: string | number;
  description: string;
  isKeyIssue: boolean | number;
};

type AchievementRow = {
  id: string | number;
  reportId: string | number;
  description: string;
  isKeyAchievement: boolean | number;
};

type HoursRow = {
  id: string | number;
  reportId: string | number;
  category: string;
  hours: number;
};

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function toId(value: string | number): string {
  return String(value);
}

function toDateString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = value as Date;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toDateParam(value: string | Date): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value.slice(0, 10);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export type CreateReportInput = {
  projectId?: string;
  weekStartDate: string;
  weekEndDate: string;
  notes?: string;
  tasks: CreateTaskInput[];
  nextWeekTasks: CreateNextWeekTaskInput[];
  blockers: CreateBlockerInput[];
  achievements: CreateAchievementInput[];
  hoursWorked: CreateHoursInput[];
};

export type UpdateReportInput = CreateReportInput;

export type CreateTaskInput = {
  taskName: string;
  priority: "low" | "medium" | "high" | "critical";
  plannedPercent: number;
  actualPercent: number;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  timePlanned?: number;
  timeSpent?: number;
  deliverable?: string;
};

export type CreateNextWeekTaskInput = {
  taskName: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "not_started" | "in_progress" | "completed";
};

export type CreateBlockerInput = {
  description: string;
  isKeyIssue: boolean;
};

export type CreateAchievementInput = {
  description: string;
  isKeyAchievement: boolean;
};

export type CreateHoursInput = {
  category: string;
  hours: number;
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["needs_correction", "approved"],
  needs_correction: ["submitted"],
  approved: [],
};

function mapReport(row: ReportRow) {
  return {
    id: toId(row.id),
    userId: toId(row.userId),
    projectId: row.projectId != null ? toId(row.projectId) : null,
    weekStartDate: toDateString(row.weekStartDate),
    weekEndDate: toDateString(row.weekEndDate),
    status: row.status,
    versionNumber: Number(row.versionNumber ?? 0),
    notes: row.notes,
    userName: row.userName,
    projectName: row.projectName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getTasksByReportId(reportId: string | number, runner: QueryRunner = defaultRunner) {
  const rows = (await runner.rows(
    `SELECT taskName, priority, plannedPercent, actualPercent, status, timePlanned, timeSpent, deliverable, sortOrder
     FROM ReportTask WHERE reportId = ? ORDER BY sortOrder ASC`,
    [reportId]
  )) as TaskRow[];
  return rows.map((r) => {
    const task: CreateTaskInput = {
      taskName: r.taskName,
      priority: r.priority,
      plannedPercent: r.plannedPercent,
      actualPercent: r.actualPercent,
      status: r.status,
    };
    if (r.timePlanned != null) task.timePlanned = Number(r.timePlanned);
    if (r.timeSpent != null) task.timeSpent = Number(r.timeSpent);
    if (r.deliverable != null) task.deliverable = r.deliverable;
    return task;
  });
}

async function getNextWeekTasksByReportId(reportId: string | number, runner: QueryRunner = defaultRunner): Promise<CreateNextWeekTaskInput[]> {
  const rows = (await runner.rows(
    `SELECT taskName, priority, status, sortOrder
     FROM ReportNextWeekTask WHERE reportId = ? ORDER BY sortOrder ASC`,
    [reportId]
  )) as NextWeekTaskRow[];
  return rows.map((r) => ({
    taskName: r.taskName,
    priority: r.priority,
    status: r.status,
  }));
}

async function getBlockersByReportId(reportId: string | number, runner: QueryRunner = defaultRunner): Promise<CreateBlockerInput[]> {
  const rows = (await runner.rows(
    `SELECT description, isKeyIssue FROM ReportBlocker WHERE reportId = ?`,
    [reportId]
  )) as BlockerRow[];
  return rows.map((r) => ({
    description: r.description,
    isKeyIssue: toBoolean(r.isKeyIssue),
  }));
}

async function getAchievementsByReportId(reportId: string | number, runner: QueryRunner = defaultRunner): Promise<CreateAchievementInput[]> {
  const rows = (await runner.rows(
    `SELECT description, isKeyAchievement FROM ReportAchievement WHERE reportId = ?`,
    [reportId]
  )) as AchievementRow[];
  return rows.map((r) => ({
    description: r.description,
    isKeyAchievement: toBoolean(r.isKeyAchievement),
  }));
}

async function getHoursByReportId(reportId: string | number, runner: QueryRunner = defaultRunner): Promise<CreateHoursInput[]> {
  const rows = (await runner.rows(
    `SELECT category, hours FROM ReportHoursWorked WHERE reportId = ?`,
    [reportId]
  )) as HoursRow[];
  return rows.map((r) => ({
    category: r.category,
    hours: Number(r.hours),
  }));
}

type ReportContent = {
  tasks: CreateTaskInput[];
  nextWeekTasks: CreateNextWeekTaskInput[];
  blockers: CreateBlockerInput[];
  achievements: CreateAchievementInput[];
  hoursWorked: CreateHoursInput[];
};

async function loadReportContent(reportId: string | number, runner: QueryRunner): Promise<ReportContent> {
  const [tasks, nextWeekTasks, blockers, achievements, hoursWorked] = await Promise.all([
    getTasksByReportId(reportId, runner),
    getNextWeekTasksByReportId(reportId, runner),
    getBlockersByReportId(reportId, runner),
    getAchievementsByReportId(reportId, runner),
    getHoursByReportId(reportId, runner),
  ]);
  return { tasks, nextWeekTasks, blockers, achievements, hoursWorked };
}

async function replaceNested(exec: TransactionExec, reportId: string | number, data: CreateReportInput) {
  await exec.run(`DELETE FROM ReportTask WHERE reportId = ?`, [reportId]);
  await exec.run(`DELETE FROM ReportNextWeekTask WHERE reportId = ?`, [reportId]);
  await exec.run(`DELETE FROM ReportBlocker WHERE reportId = ?`, [reportId]);
  await exec.run(`DELETE FROM ReportAchievement WHERE reportId = ?`, [reportId]);
  await exec.run(`DELETE FROM ReportHoursWorked WHERE reportId = ?`, [reportId]);

  for (let i = 0; i < data.tasks.length; i++) {
    const t = data.tasks[i]!;
    await exec.run(
      `INSERT INTO ReportTask (reportId, taskName, priority, plannedPercent, actualPercent, status, timePlanned, timeSpent, deliverable, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        t.taskName,
        t.priority,
        toNumber(t.plannedPercent, 0),
        toNumber(t.actualPercent, 0),
        t.status,
        toNullableNumber(t.timePlanned),
        toNullableNumber(t.timeSpent),
        t.deliverable ?? null,
        i,
      ]
    );
  }

  for (let i = 0; i < data.nextWeekTasks.length; i++) {
    const t = data.nextWeekTasks[i]!;
    await exec.run(
      `INSERT INTO ReportNextWeekTask (reportId, taskName, priority, status, sortOrder)
       VALUES (?, ?, ?, ?, ?)`,
      [reportId, t.taskName, t.priority, t.status, i]
    );
  }

  for (const b of data.blockers) {
    await exec.run(
      `INSERT INTO ReportBlocker (reportId, description, isKeyIssue) VALUES (?, ?, ?)`,
      [reportId, b.description, b.isKeyIssue ? 1 : 0]
    );
  }

  for (const a of data.achievements) {
    await exec.run(
      `INSERT INTO ReportAchievement (reportId, description, isKeyAchievement) VALUES (?, ?, ?)`,
      [reportId, a.description, a.isKeyAchievement ? 1 : 0]
    );
  }

  for (const h of data.hoursWorked) {
    await exec.run(
      `INSERT INTO ReportHoursWorked (reportId, category, hours) VALUES (?, ?, ?)`,
      [reportId, h.category, toNumber(h.hours, 0)]
    );
  }
}

export async function listMyReports(userId: string) {
  const rows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.versionNumber, wr.notes, wr.createdAt, wr.updatedAt,
            u.name AS userName, p.name AS projectName
     FROM WeeklyReport wr
     LEFT JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     WHERE wr.userId = ?
     ORDER BY wr.weekStartDate DESC`,
    [userId]
  )) as ReportRow[];
  return rows.map(mapReport);
}

export type ReportListFilters = {
  memberId?: string;
  projectId?: string;
  category?: string;
  from?: string;
  to?: string;
  status?: ReportStatus;
};

export async function listAllReports(filters: ReportListFilters = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.memberId !== undefined) {
    where.push("wr.userId = ?");
    params.push(filters.memberId);
  }
  if (filters.projectId !== undefined) {
    where.push("wr.projectId = ?");
    params.push(filters.projectId);
  }
  if (filters.category !== undefined) {
    where.push("EXISTS (SELECT 1 FROM ReportHoursWorked rh WHERE rh.reportId = wr.id AND rh.category = ?)");
    params.push(filters.category);
  }
  if (filters.from !== undefined) {
    where.push("wr.weekStartDate >= ?");
    params.push(filters.from);
  }
  if (filters.to !== undefined) {
    where.push("wr.weekStartDate <= ?");
    params.push(filters.to);
  }
  if (filters.status !== undefined) {
    where.push("wr.status = ?");
    params.push(filters.status);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const rows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.versionNumber, wr.notes, wr.createdAt, wr.updatedAt,
            u.name AS userName, p.name AS projectName
     FROM WeeklyReport wr
     LEFT JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ${whereSql}
     ORDER BY wr.weekStartDate DESC, u.name ASC`,
    params
  )) as ReportRow[];
  return rows.map(mapReport);
}

export type TeamMemberStatus = ReportStatus | "not_started";

export type TeamWeeklyResult = {
  weekStart: string;
  weekEnd: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: TeamMemberStatus;
    reports: ReturnType<typeof mapReport>[];
  }[];
  summary: {
    total: number;
    submitted: number;
    needs_correction: number;
    approved: number;
    draft: number;
    not_started: number;
    completionRate: number;
  };
};

function currentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateParam(monday), to: toDateParam(sunday) };
}

function resolveWeekRange(from?: string, to?: string): { from: string; to: string } {
  if (from || to) {
    const resolved = { from: from ?? to!, to: to ?? from! };
    if (resolved.from > resolved.to) {
      throw new ApiError(400, "The start date must be on or before the end date.");
    }
    return resolved;
  }
  return currentWeekRange();
}

async function getTeamRoster(args: {
  selfOnly: boolean;
  selfId: string;
  memberId?: string;
}): Promise<{ id: string | number; name: string; email: string }[]> {
  const where = ["u.isActive = 1"];
  const params: unknown[] = [];
  if (args.selfOnly) {
    where.push("u.id = ?");
    params.push(args.selfId);
  } else if (args.memberId !== undefined) {
    where.push("u.id = ?");
    params.push(args.memberId);
  }
  return (await query(
    `SELECT DISTINCT u.id, u.name, u.email
     FROM User u
     JOIN UserRole ur ON ur.userId = u.id
     JOIN Role r ON r.id = ur.roleId
     JOIN RolePermission rp ON rp.roleId = r.id
     JOIN Permission p ON p.id = rp.permissionId
     WHERE ${where.join(" AND ")} AND p.\`key\` = ?
     ORDER BY u.name ASC`,
    [...params, PERMISSIONS.REPORT_SUBMIT]
  )) as { id: string | number; name: string; email: string }[];
}

export async function listTeamWeekly(args: {
  from?: string;
  to?: string;
  memberId?: string;
  projectId?: string;
  category?: string;
  selfOnly: boolean;
  selfId: string;
}) {
  const { from, to } = resolveWeekRange(args.from, args.to);

  const roster = await getTeamRoster({
    selfOnly: args.selfOnly,
    selfId: args.selfId,
    ...(args.memberId !== undefined ? { memberId: args.memberId } : {}),
  });

  const reportWhere = ["wr.weekStartDate BETWEEN ? AND ?"];
  const reportParams: unknown[] = [from, to];
  if (args.projectId !== undefined) {
    reportWhere.push("wr.projectId = ?");
    reportParams.push(args.projectId);
  }
  if (args.category !== undefined) {
    reportWhere.push("EXISTS (SELECT 1 FROM ReportHoursWorked rh WHERE rh.reportId = wr.id AND rh.category = ?)");
    reportParams.push(args.category);
  }
  if (args.selfOnly) {
    reportWhere.push("wr.userId = ?");
    reportParams.push(args.selfId);
  }
  const reportRows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.versionNumber, wr.notes, wr.createdAt, wr.updatedAt,
            u.name AS userName, p.name AS projectName
     FROM WeeklyReport wr
     LEFT JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     WHERE ${reportWhere.join(" AND ")}
     ORDER BY wr.weekStartDate ASC, wr.updatedAt ASC, wr.id ASC`,
    reportParams
  )) as ReportRow[];

  const byUser = new Map<string, ReportRow[]>();
  for (const row of reportRows) {
    const key = toId(row.userId);
    const list = byUser.get(key) ?? [];
    list.push(row);
    byUser.set(key, list);
  }

  const members = roster.map((member) => {
    const id = toId(member.id);
    const reports = (byUser.get(id) ?? []).map(mapReport);
    const latest = reports[reports.length - 1];
    return {
      id,
      name: member.name,
      email: member.email,
      status: (latest?.status ?? "not_started") as TeamMemberStatus,
      reports,
    };
  });

  const counts: Record<TeamMemberStatus, number> = {
    submitted: 0,
    needs_correction: 0,
    approved: 0,
    draft: 0,
    not_started: 0,
  };
  for (const member of members) {
    counts[member.status] += 1;
  }
  const started = members.length - counts.not_started;
  const completionRate =
    members.length > 0 ? Math.round((started / members.length) * 100) : 0;

  return {
    weekStart: from,
    weekEnd: to,
    members,
    summary: { total: members.length, ...counts, completionRate },
  } satisfies TeamWeeklyResult;
}

export type TeamSectionKey =
  | "tasks"
  | "next_week_tasks"
  | "blockers"
  | "achievements"
  | "hours";

type TeamSectionRowItem = {
  tasks: { taskName: string; priority: string; plannedPercent: number; actualPercent: number; status: string; timePlanned?: number; timeSpent?: number; deliverable?: string };
  next_week_tasks: { taskName: string; priority: string; status: string };
  blockers: { description: string; isKeyIssue: boolean };
  achievements: { description: string; isKeyAchievement: boolean };
  hours: { category: string; hours: number };
};

export async function listTeamSections(args: {
  from?: string;
  to?: string;
  section: TeamSectionKey;
  memberId?: string;
  projectId?: string;
  category?: string;
  selfOnly: boolean;
  selfId: string;
}) {
  const { from, to } = resolveWeekRange(args.from, args.to);

  const defs: Record<
    TeamSectionKey,
    {
      selectSql: string;
      joinSql: string;
      nullCheck: string;
      orderSql: string;
      mapItem: (row: Record<string, unknown>) => TeamSectionRowItem[TeamSectionKey];
    }
  > = {
    tasks: {
      selectSql: `rt.taskName, rt.priority, rt.plannedPercent, rt.actualPercent, rt.status, rt.timePlanned, rt.timeSpent, rt.deliverable`,
      joinSql: `LEFT JOIN ReportTask rt ON rt.reportId = wr.id`,
      nullCheck: `taskName`,
      orderSql: `rt.sortOrder ASC, rt.id ASC`,
      mapItem: (r) => {
        const item: TeamSectionRowItem["tasks"] = {
          taskName: r.taskName as string,
          priority: r.priority as string,
          plannedPercent: Number(r.plannedPercent ?? 0),
          actualPercent: Number(r.actualPercent ?? 0),
          status: r.status as string,
        };
        if (r.timePlanned != null) item.timePlanned = Number(r.timePlanned);
        if (r.timeSpent != null) item.timeSpent = Number(r.timeSpent);
        if (r.deliverable != null) item.deliverable = r.deliverable as string;
        return item;
      },
    },
    next_week_tasks: {
      selectSql: `rnt.taskName, rnt.priority, rnt.status`,
      joinSql: `LEFT JOIN ReportNextWeekTask rnt ON rnt.reportId = wr.id`,
      nullCheck: `taskName`,
      orderSql: `rnt.sortOrder ASC, rnt.id ASC`,
      mapItem: (r) => ({
        taskName: r.taskName as string,
        priority: r.priority as string,
        status: r.status as string,
      }),
    },
    blockers: {
      selectSql: `rb.description, rb.isKeyIssue`,
      joinSql: `LEFT JOIN ReportBlocker rb ON rb.reportId = wr.id`,
      nullCheck: `description`,
      orderSql: `rb.id ASC`,
      mapItem: (r) => ({
        description: r.description as string,
        isKeyIssue: toBoolean(r.isKeyIssue),
      }),
    },
    achievements: {
      selectSql: `ra.description, ra.isKeyAchievement`,
      joinSql: `LEFT JOIN ReportAchievement ra ON ra.reportId = wr.id`,
      nullCheck: `description`,
      orderSql: `ra.id ASC`,
      mapItem: (r) => ({
        description: r.description as string,
        isKeyAchievement: toBoolean(r.isKeyAchievement),
      }),
    },
    hours: {
      selectSql: `rh.category, rh.hours`,
      joinSql: `LEFT JOIN ReportHoursWorked rh ON rh.reportId = wr.id`,
      nullCheck: `category`,
      orderSql: `rh.id ASC`,
      mapItem: (r) => ({
        category: r.category as string,
        hours: Number(r.hours ?? 0),
      }),
    },
  };

  const def = defs[args.section];
  if (!def) {
    throw new ApiError(400, "Unknown section. Allowed: tasks, next_week_tasks, blockers, achievements, hours.");
  }

  const reportWhere = ["wr.weekStartDate BETWEEN ? AND ?"];
  const reportParams: unknown[] = [from, to];
  if (args.projectId !== undefined) {
    reportWhere.push("wr.projectId = ?");
    reportParams.push(args.projectId);
  }
  if (args.category !== undefined) {
    reportWhere.push("EXISTS (SELECT 1 FROM ReportHoursWorked rh WHERE rh.reportId = wr.id AND rh.category = ?)");
    reportParams.push(args.category);
  }
  if (args.selfOnly) {
    reportWhere.push("wr.userId = ?");
    reportParams.push(args.selfId);
  } else if (args.memberId !== undefined) {
    reportWhere.push("wr.userId = ?");
    reportParams.push(args.memberId);
  }

  const rows = (await query(
    `SELECT wr.id AS reportId,
            u.id AS userId,
            u.name AS userName,
            wr.status AS reportStatus,
            wr.weekStartDate,
            wr.weekEndDate,
            p.name AS projectName,
            ${def.selectSql}
     FROM WeeklyReport wr
     JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ${def.joinSql}
     WHERE ${reportWhere.join(" AND ")}
     ORDER BY u.name ASC, wr.weekStartDate ASC, ${def.orderSql}`,
    reportParams
  )) as (Record<string, unknown> & {
    reportId: string | number;
    userId: string | number;
    userName: string;
    reportStatus: ReportStatus;
    weekStartDate: string;
    weekEndDate: string;
    projectName: string | null;
  })[];

  const groups = new Map<
    string,
    {
      reportId: string;
      userId: string;
      userName: string;
      status: ReportStatus;
      weekStartDate: string;
      weekEndDate: string;
      projectName: string | null;
      items: TeamSectionRowItem[TeamSectionKey][];
    }
  >();

  for (const row of rows) {
    const key = toId(row.reportId);
    const group = groups.get(key) ?? {
      reportId: key,
      userId: toId(row.userId),
      userName: row.userName,
      status: row.reportStatus,
      weekStartDate: toDateString(row.weekStartDate),
      weekEndDate: toDateString(row.weekEndDate),
      projectName: row.projectName,
      items: [],
    };
    if ((row as Record<string, unknown>)[def.nullCheck] != null) {
      group.items.push(def.mapItem(row as Record<string, unknown>));
    }
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

export async function getReportById(id: string) {
  const rows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.versionNumber, wr.notes, wr.createdAt, wr.updatedAt,
            u.name AS userName, p.name AS projectName
     FROM WeeklyReport wr
     LEFT JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     WHERE wr.id = ? LIMIT 1`,
    [id]
  )) as ReportRow[];
  const report = rows[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  const [tasks, nextWeekTasks, blockers, achievements, hoursWorked, reviews, versions] = await Promise.all([
    getTasksByReportId(report.id),
    getNextWeekTasksByReportId(report.id),
    getBlockersByReportId(report.id),
    getAchievementsByReportId(report.id),
    getHoursByReportId(report.id),
    getReviewsByReportId(report.id),
    listReportVersions(report.id),
  ]);

  return { ...mapReport(report), tasks, nextWeekTasks, blockers, achievements, hoursWorked, reviews, versions };
}

type ReviewRow = {
  id: string | number;
  reportId: string | number;
  reviewerId: string | number;
  reviewerName: string;
  action: "approved" | "request_correction";
  comment: string | null;
  versionId: string | number;
  versionNumber: number;
  createdAt: Date;
};

async function getReviewsByReportId(reportId: string | number) {
  const rows = (await query(
    `SELECT rv.id, rv.reportId, rv.reviewerId, rv.action, rv.comment, rv.createdAt,
            rv.versionId, v.versionNumber, u.name AS reviewerName
     FROM ReportReview rv
     LEFT JOIN ReportVersion v ON v.id = rv.versionId
     LEFT JOIN User u ON u.id = rv.reviewerId
     WHERE rv.reportId = ?
     ORDER BY rv.createdAt DESC, rv.id DESC`,
    [reportId]
  )) as ReviewRow[];
  return rows.map((r) => ({
    id: toId(r.id),
    reportId: toId(r.reportId),
    reviewerId: toId(r.reviewerId),
    reviewerName: r.reviewerName,
    action: r.action,
    comment: r.comment,
    versionId: toId(r.versionId),
    versionNumber: Number(r.versionNumber ?? 0),
    createdAt: r.createdAt,
  }));
}

export async function assertCanReadReport(id: string, viewerId: string, permissions: string[]) {
  const rows = (await query(
    `SELECT id, userId FROM WeeklyReport WHERE id = ? LIMIT 1`,
    [id]
  )) as { id: string | number; userId: string | number }[];
  const report = rows[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }
  const canViewAll = permissions.includes(PERMISSIONS.REPORT_VIEW_ALL);
  if (String(report.userId) !== viewerId && !canViewAll) {
    throw new ApiError(403, "You can only view your own reports.");
  }
}

export async function createReport(userId: string, data: CreateReportInput) {
  const id = toId(
    await withTransaction(async (exec) => {
      const insertId = await exec.insertId(
        `INSERT INTO WeeklyReport (userId, projectId, weekStartDate, weekEndDate, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, data.projectId ?? null, toDateParam(data.weekStartDate), toDateParam(data.weekEndDate), data.notes ?? null]
      );
      await replaceNested(exec, insertId, data);
      return insertId;
    })
  );

  return getReportById(id);
}

export async function updateReport(id: string, userId: string, data: UpdateReportInput) {
  const existing = (await query(
    `SELECT id, userId, status FROM WeeklyReport WHERE id = ? LIMIT 1`,
    [id]
  )) as { id: string | number; userId: string | number; status: string }[];
  const report = existing[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }
  if (String(report.userId) !== userId) {
    throw new ApiError(403, "You can only edit your own reports.");
  }
  if (report.status !== "draft" && report.status !== "needs_correction") {
    throw new ApiError(400, "Only draft or needs_correction reports can be edited.");
  }

  await withTransaction(async (exec) => {
    await exec.run(
      `UPDATE WeeklyReport SET projectId = ?, weekStartDate = ?, weekEndDate = ?, notes = ?, updatedAt = NOW() WHERE id = ?`,
      [data.projectId ?? null, toDateParam(data.weekStartDate), toDateParam(data.weekEndDate), data.notes ?? null, id]
    );
    await replaceNested(exec, id, data);
  });

  return getReportById(id);
}

export async function deleteReport(id: string, userId: string) {
  const existing = (await query(
    `SELECT id, userId, status FROM WeeklyReport WHERE id = ? LIMIT 1`,
    [id]
  )) as { id: string | number; userId: string | number; status: string }[];
  const report = existing[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }
  if (String(report.userId) !== userId) {
    throw new ApiError(403, "You can only delete your own reports.");
  }
  if (report.status !== "draft") {
    throw new ApiError(400, "Only draft reports can be deleted.");
  }
  await query(`DELETE FROM WeeklyReport WHERE id = ?`, [id]);
}

export async function transitionStatus(id: string, userId: string, newStatus: string) {
  if (newStatus !== "submitted") {
    throw new ApiError(400, "Only the submit transition is supported here.");
  }

  const existing = (await query(
    `SELECT id, userId, status, versionNumber, projectId, weekStartDate, weekEndDate, notes
     FROM WeeklyReport WHERE id = ? LIMIT 1`,
    [id]
  )) as {
    id: string | number;
    userId: string | number;
    status: string;
    versionNumber: number;
    projectId: string | number | null;
    weekStartDate: string;
    weekEndDate: string;
    notes: string | null;
  }[];
  const report = existing[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  const allowed = VALID_TRANSITIONS[report.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition from "${report.status}" to "${newStatus}".`);
  }

  if (String(report.userId) !== userId) {
    throw new ApiError(403, "You can only submit your own reports.");
  }

  await withTransaction(async (exec) => {
    const versionNumber = Number(report.versionNumber ?? 0) + 1;
    const content = await loadReportContent(id, exec);

    await exec.run(
      `UPDATE WeeklyReport SET status = ?, versionNumber = ?, updatedAt = NOW() WHERE id = ?`,
      [newStatus, versionNumber, id]
    );

    await exec.run(
      `INSERT INTO ReportVersion (reportId, versionNumber, projectId, weekStartDate, weekEndDate, notes,
                                  tasks, nextWeekTasks, blockers, achievements, hoursWorked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        versionNumber,
        report.projectId ?? null,
        toDateParam(report.weekStartDate),
        toDateParam(report.weekEndDate),
        report.notes ?? null,
        JSON.stringify(content.tasks),
        JSON.stringify(content.nextWeekTasks),
        JSON.stringify(content.blockers),
        JSON.stringify(content.achievements),
        JSON.stringify(content.hoursWorked),
      ]
    );
  });

  return getReportById(id);
}

export async function getAvailableCategories(): Promise<string[]> {
  const defaultCategories = [
    "Development",
    "Design",
    "Meetings",
    "Research",
    "Documentation",
    "Testing",
    "Other",
  ];
  try {
    const rows = (await query(
      `SELECT DISTINCT category FROM ReportHoursWorked WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`
    )) as { category: string }[];
    const dbCategories = rows.map((r) => r.category);
    const set = new Set([...defaultCategories, ...dbCategories]);
    return Array.from(set).sort();
  } catch {
    return defaultCategories;
  }
}
