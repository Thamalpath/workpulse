import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import {
  listMyReports,
  listAllReports,
  listTeamWeekly,
  listTeamSections,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  transitionStatus,
  assertCanReadReport,
  getAvailableCategories,
} from "../services/report.service.js";
import type { ReportStatus, ReportListFilters, TeamSectionKey } from "../services/report.service.js";
import { PERMISSIONS } from "../constants/permissions.js";

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function queryEnum<T extends string>(value: unknown): T | undefined {
  const str = queryString(value);
  return str as T | undefined;
}

function queryFilters(
  query: Request["query"],
  keys: readonly (keyof Request["query"])[]
): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const key of keys) {
    const value = queryString(query[key]);
    if (value !== undefined) filters[key] = value;
  }
  return filters;
}

export async function getMyReports(req: Request, res: Response) {
  const userId = (req as AuthedRequest).userId!;
  const data = await listMyReports(userId);
  res.json({ success: true, data });
}

export async function getAllReports(req: Request, res: Response) {
  const data = await listAllReports(
    queryFilters(req.query, ["memberId", "projectId", "category", "from", "to", "status"]) as ReportListFilters
  );
  res.json({ success: true, data });
}

function teamScope(req: Request) {
  const authed = req as AuthedRequest;
  const isManager = (authed.permissions ?? []).includes(PERMISSIONS.REPORT_VIEW_ALL);
  return {
    selfOnly: !isManager,
    selfId: authed.userId!,
  };
}

export async function getTeamWeekly(req: Request, res: Response) {
  const { selfOnly, selfId } = teamScope(req);
  const data = await listTeamWeekly({
    ...queryFilters(req.query, ["from", "to", "memberId", "projectId", "category"]),
    selfOnly,
    selfId,
  } as Parameters<typeof listTeamWeekly>[0]);
  res.json({ success: true, data });
}

export async function getTeamSections(req: Request, res: Response) {
  const { selfOnly, selfId } = teamScope(req);
  const section = queryEnum<TeamSectionKey>(req.query.section) ?? "tasks";
  const data = await listTeamSections({
    ...queryFilters(req.query, ["from", "to", "memberId", "projectId", "category"]),
    section,
    selfOnly,
    selfId,
  } as Parameters<typeof listTeamSections>[0]);
  res.json({ success: true, data });
}

export async function getReportCategories(_req: Request, res: Response) {
  const data = await getAvailableCategories();
  res.json({ success: true, data });
}

export async function getReport(req: Request, res: Response) {
  const id = req.params.id as string;
  const authed = req as AuthedRequest;
  await assertCanReadReport(id, authed.userId!, authed.permissions ?? []);
  const data = await getReportById(id);
  res.json({ success: true, data });
}

export async function postReport(req: Request, res: Response) {
  const userId = (req as AuthedRequest).userId!;
  const data = await createReport(userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function patchReport(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as AuthedRequest).userId!;
  const data = await updateReport(id, userId, req.body);
  res.json({ success: true, data });
}

export async function removeReport(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as AuthedRequest).userId!;
  await deleteReport(id, userId);
  res.json({ success: true, message: "Report deleted." });
}

export async function submitReport(req: Request, res: Response) {
  const id = req.params.id as string;
  const userId = (req as AuthedRequest).userId!;
  const data = await transitionStatus(id, userId, "submitted");
  res.json({ success: true, data });
}
