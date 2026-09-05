import type { Request, Response } from "express";
import { getAnalyticsOverview } from "../services/analytics.service.js";

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export async function getOverview(req: Request, res: Response) {
  const from = queryString(req.query.from);
  const to = queryString(req.query.to);
  const memberId = queryString(req.query.memberId);
  const projectId = queryString(req.query.projectId);

  const data = await getAnalyticsOverview({
    from,
    to,
    memberId,
    projectId,
  });

  res.json({ success: true, data });
}
