import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import {
  listMyReports,
  listAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  transitionStatus,
  assertCanReadReport,
} from "../services/report.service.js";

export async function getMyReports(req: Request, res: Response) {
  const userId = (req as AuthedRequest).userId!;
  const data = await listMyReports(userId);
  res.json({ success: true, data });
}

export async function getAllReports(_req: Request, res: Response) {
  const data = await listAllReports();
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
