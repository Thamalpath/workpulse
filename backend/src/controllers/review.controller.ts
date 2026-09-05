import type { Request, Response } from "express";

import type { AuthedRequest } from "../middleware/auth.middleware.js";
import { reviewReport as reviewReportService } from "../services/review.service.js";

export async function reviewReport(req: Request, res: Response) {
  const id = req.params.id as string;
  const reviewerId = (req as AuthedRequest).userId!;
  const { action, comment } = req.body as { action?: string; comment?: string };

  const data = await reviewReportService(
    id,
    reviewerId,
    action as "approved" | "request_correction",
    comment
  );
  res.json({ success: true, data });
}