import type { Request, Response } from "express";

import type { AuthedRequest } from "../middleware/auth.middleware.js";
import { assertCanReadReport } from "../services/report.service.js";
import {
  getReportVersion,
  listReportVersions,
} from "../services/reportVersion.service.js";

export async function getVersions(req: Request, res: Response) {
  const reportId = req.params.id as string;
  const authed = req as AuthedRequest;
  await assertCanReadReport(reportId, authed.userId!, authed.permissions ?? []);

  const data = await listReportVersions(reportId);
  res.json({ success: true, data });
}

export async function getVersionDetail(req: Request, res: Response) {
  const reportId = req.params.id as string;
  const versionId = req.params.versionId as string;
  const authed = req as AuthedRequest;
  await assertCanReadReport(reportId, authed.userId!, authed.permissions ?? []);

  const data = await getReportVersion(versionId);
  if (String(data.reportId) !== reportId) {
    return res.status(403).json({ success: false, message: "Version does not belong to this report." });
  }
  res.json({ success: true, data });
}