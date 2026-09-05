import { query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";

type VersionMetaRow = {
  id: string | number;
  reportId: string | number;
  versionNumber: number;
  projectId: string | number | null;
  weekStartDate: string;
  weekEndDate: string;
  notes: string | null;
  projectName: string | null;
  createdAt: Date;
};

type VersionContentRow = VersionMetaRow & {
  tasks: unknown;
  nextWeekTasks: unknown;
  blockers: unknown;
  achievements: unknown;
  hoursWorked: unknown;
};

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

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export type ReportVersionMeta = {
  id: string;
  reportId: string;
  versionNumber: number;
  projectId: string | null;
  weekStartDate: string;
  weekEndDate: string;
  notes: string | null;
  projectName: string | null;
  createdAt: Date;
};

function mapMeta(row: VersionMetaRow): ReportVersionMeta {
  return {
    id: toId(row.id),
    reportId: toId(row.reportId),
    versionNumber: Number(row.versionNumber),
    projectId: row.projectId != null ? toId(row.projectId) : null,
    weekStartDate: toDateString(row.weekStartDate),
    weekEndDate: toDateString(row.weekEndDate),
    notes: row.notes,
    projectName: row.projectName,
    createdAt: row.createdAt,
  };
}

export async function listReportVersions(reportId: string | number): Promise<ReportVersionMeta[]> {
  const rows = (await query(
    `SELECT v.id, v.reportId, v.versionNumber, v.projectId, v.weekStartDate, v.weekEndDate, v.notes, v.createdAt,
            p.name AS projectName
     FROM ReportVersion v
     LEFT JOIN Project p ON p.id = v.projectId
     WHERE v.reportId = ?
     ORDER BY v.versionNumber DESC`,
    [reportId]
  )) as VersionMetaRow[];
  return rows.map(mapMeta);
}

export async function getReportVersion(id: string) {
  const rows = (await query(
    `SELECT v.id, v.reportId, v.versionNumber, v.projectId, v.weekStartDate, v.weekEndDate, v.notes,
            v.tasks, v.nextWeekTasks, v.blockers, v.achievements, v.hoursWorked, v.createdAt,
            p.name AS projectName
     FROM ReportVersion v
     LEFT JOIN Project p ON p.id = v.projectId
     WHERE v.id = ? LIMIT 1`,
    [id]
  )) as VersionContentRow[];
  const version = rows[0];
  if (!version) {
    throw new ApiError(404, "Report version not found.");
  }

  return {
    ...mapMeta(version),
    reportId: toId(version.reportId),
    tasks: toArray(version.tasks),
    nextWeekTasks: toArray(version.nextWeekTasks),
    blockers: toArray(version.blockers),
    achievements: toArray(version.achievements),
    hoursWorked: toArray(version.hoursWorked),
  };
}

export async function getLatestVersion(reportId: string | number): Promise<ReportVersionMeta | null> {
  const rows = (await query(
    `SELECT v.id, v.reportId, v.versionNumber, v.projectId, v.weekStartDate, v.weekEndDate, v.notes, v.createdAt,
            p.name AS projectName
     FROM ReportVersion v
     LEFT JOIN Project p ON p.id = v.projectId
     WHERE v.reportId = ?
     ORDER BY v.versionNumber DESC
     LIMIT 1`,
    [reportId]
  )) as VersionMetaRow[];
  return rows[0] ? mapMeta(rows[0]) : null;
}