import { query, insert, withTransaction, type TransactionExec } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type ReportRow = {
  id: string | number;
  userId: string | number;
  projectId: string | number | null;
  weekStartDate: string;
  weekEndDate: string;
  status: "draft" | "submitted" | "needs_correction" | "approved";
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  projectName: string | null;
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
    weekStartDate: row.weekStartDate,
    weekEndDate: row.weekEndDate,
    status: row.status,
    notes: row.notes,
    userName: row.userName,
    projectName: row.projectName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getTasksByReportId(reportId: string | number) {
  const rows = (await query(
    `SELECT taskName, priority, plannedPercent, actualPercent, status, timePlanned, timeSpent, deliverable, sortOrder
     FROM ReportTask WHERE reportId = ? ORDER BY sortOrder ASC`,
    [reportId]
  )) as TaskRow[];
  return rows.map((r) => {
    const task: {
      taskName: string;
      priority: string;
      plannedPercent: number;
      actualPercent: number;
      status: string;
      timePlanned?: number;
      timeSpent?: number;
      deliverable?: string;
    } = {
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

async function getNextWeekTasksByReportId(reportId: string | number): Promise<CreateNextWeekTaskInput[]> {
  const rows = (await query(
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

async function getBlockersByReportId(reportId: string | number): Promise<CreateBlockerInput[]> {
  const rows = (await query(
    `SELECT description, isKeyIssue FROM ReportBlocker WHERE reportId = ?`,
    [reportId]
  )) as BlockerRow[];
  return rows.map((r) => ({
    description: r.description,
    isKeyIssue: toBoolean(r.isKeyIssue),
  }));
}

async function getAchievementsByReportId(reportId: string | number): Promise<CreateAchievementInput[]> {
  const rows = (await query(
    `SELECT description, isKeyAchievement FROM ReportAchievement WHERE reportId = ?`,
    [reportId]
  )) as AchievementRow[];
  return rows.map((r) => ({
    description: r.description,
    isKeyAchievement: toBoolean(r.isKeyAchievement),
  }));
}

async function getHoursByReportId(reportId: string | number): Promise<CreateHoursInput[]> {
  const rows = (await query(
    `SELECT category, hours FROM ReportHoursWorked WHERE reportId = ?`,
    [reportId]
  )) as HoursRow[];
  return rows.map((r) => ({
    category: r.category,
    hours: Number(r.hours),
  }));
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
      [reportId, t.taskName, t.priority, t.plannedPercent, t.actualPercent, t.status, t.timePlanned ?? null, t.timeSpent ?? null, t.deliverable ?? null, i]
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
      [reportId, h.category, h.hours]
    );
  }
}

export async function listMyReports(userId: string) {
  const rows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.notes, wr.createdAt, wr.updatedAt,
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

export async function listAllReports() {
  const rows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.notes, wr.createdAt, wr.updatedAt,
            u.name AS userName, p.name AS projectName
     FROM WeeklyReport wr
     LEFT JOIN User u ON u.id = wr.userId
     LEFT JOIN Project p ON p.id = wr.projectId
     ORDER BY wr.weekStartDate DESC`
  )) as ReportRow[];
  return rows.map(mapReport);
}

export async function getReportById(id: string) {
  const rows = (await query(
    `SELECT wr.id, wr.userId, wr.projectId, wr.weekStartDate, wr.weekEndDate, wr.status, wr.notes, wr.createdAt, wr.updatedAt,
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

  const [tasks, nextWeekTasks, blockers, achievements, hoursWorked] = await Promise.all([
    getTasksByReportId(report.id),
    getNextWeekTasksByReportId(report.id),
    getBlockersByReportId(report.id),
    getAchievementsByReportId(report.id),
    getHoursByReportId(report.id),
  ]);

  return { ...mapReport(report), tasks, nextWeekTasks, blockers, achievements, hoursWorked };
}

export async function createReport(userId: string, data: CreateReportInput) {
  const id = toId(
    await withTransaction(async (exec) => {
      const insertId = await exec.insertId(
        `INSERT INTO WeeklyReport (userId, projectId, weekStartDate, weekEndDate, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, data.projectId ?? null, data.weekStartDate, data.weekEndDate, data.notes ?? null]
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
      [data.projectId ?? null, data.weekStartDate, data.weekEndDate, data.notes ?? null, id]
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
  const existing = (await query(
    `SELECT id, userId, status FROM WeeklyReport WHERE id = ? LIMIT 1`,
    [id]
  )) as { id: string | number; userId: string | number; status: string }[];
  const report = existing[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  const allowed = VALID_TRANSITIONS[report.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition from "${report.status}" to "${newStatus}".`);
  }

  if (newStatus === "submitted" && String(report.userId) !== userId) {
    throw new ApiError(403, "You can only submit your own reports.");
  }

  await query(`UPDATE WeeklyReport SET status = ?, updatedAt = NOW() WHERE id = ?`, [newStatus, id]);
  return getReportById(id);
}

export async function listProjects() {
  const rows = (await query(
    `SELECT id, name, \`key\`, description, isActive FROM Project WHERE isActive = 1 ORDER BY name ASC`
  )) as { id: string | number; name: string; key: string; description: string | null; isActive: boolean | number }[];
  return rows.map((r) => ({
    id: toId(r.id),
    name: r.name,
    key: r.key,
    description: r.description,
    isActive: toBoolean(r.isActive),
  }));
}

export async function createProject(data: { name: string; key: string; description?: string }) {
  const existing = (await query(`SELECT id FROM Project WHERE \`key\` = ? LIMIT 1`, [data.key])) as { id: string | number }[];
  if (existing.length > 0) {
    throw new ApiError(409, "A project with this key already exists.");
  }
  const id = String(
    await insert(
      `INSERT INTO Project (name, \`key\`, description) VALUES (?, ?, ?)`,
      [data.name, data.key, data.description ?? null]
    )
  );
  return { id, name: data.name, key: data.key, description: data.description ?? null, isActive: true };
}

export async function deleteProject(id: string) {
  const existing = (await query(`SELECT id FROM Project WHERE id = ? LIMIT 1`, [id])) as { id: string | number }[];
  if (existing.length === 0) {
    throw new ApiError(404, "Project not found.");
  }
  await query(`UPDATE Project SET isActive = 0, updatedAt = NOW() WHERE id = ?`, [id]);
}
