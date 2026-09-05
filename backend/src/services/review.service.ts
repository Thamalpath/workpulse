import { query, withTransaction } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { getReportById } from "./report.service.js";
import { getLatestVersion } from "./reportVersion.service.js";

export type ReviewAction = "approved" | "request_correction";

export async function reviewReport(
  reportId: string,
  reviewerId: string,
  action: ReviewAction,
  comment?: string
) {
  if (action !== "approved" && action !== "request_correction") {
    throw new ApiError(400, "Invalid review action. Use \"approved\" or \"request_correction\".");
  }
  if (action === "request_correction" && (comment == null || comment.trim() === "")) {
    throw new ApiError(400, "A comment is required when requesting changes.");
  }
  if (comment != null && typeof comment !== "string") {
    throw new ApiError(400, "Review comment must be a string.");
  }

  const existing = (await query(
    `SELECT id, userId, status FROM WeeklyReport WHERE id = ? LIMIT 1`,
    [reportId]
  )) as { id: string | number; userId: string | number; status: string }[];
  const report = existing[0];
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }
  if (report.status !== "submitted") {
    throw new ApiError(400, "Only submitted reports can be reviewed.");
  }
  if (String(report.userId) === reviewerId) {
    throw new ApiError(403, "You cannot review your own report.");
  }

  const latestVersion = await getLatestVersion(reportId);
  if (!latestVersion) {
    throw new ApiError(400, "This report has no submitted version to review.");
  }

  const nextStatus = action === "approved" ? "approved" : "needs_correction";

  await withTransaction(async (exec) => {
    await exec.run(
      `INSERT INTO ReportReview (reportId, reviewerId, versionId, action, comment) VALUES (?, ?, ?, ?, ?)`,
      [reportId, reviewerId, latestVersion.id, action, comment ?? null]
    );
    await exec.run(
      `UPDATE WeeklyReport SET status = ?, updatedAt = NOW() WHERE id = ?`,
      [nextStatus, reportId]
    );
  });

  return getReportById(reportId);
}