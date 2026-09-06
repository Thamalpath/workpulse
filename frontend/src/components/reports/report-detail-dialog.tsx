"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquareWarning,
  RotateCcw,
  Star,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { encodeId } from "@/lib/id";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  getReport,
  reviewReport,
  type Report,
  type ReviewAction,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/services/report.service";

type ReportDetailDialogProps = {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canReview?: boolean;
  onReviewSuccess?: () => void;
};

export function ReportDetailDialog({
  reportId,
  open,
  onOpenChange,
  canReview = false,
  onReviewSuccess,
}: ReportDetailDialogProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review action state
  const [reviewAction, setReviewAction] = useState<ReviewAction>("approved");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !reportId) {
      setReport(null);
      setReviewComment("");
      setReviewError(null);
      return;
    }

    setLoading(true);
    setError(null);
    getReport(reportId)
      .then((data) => {
        setReport(data);
        if (data.status === "submitted") {
          setReviewAction("approved");
        } else if (data.status === "needs_correction") {
          setReviewAction("request_correction");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load report.");
      })
      .finally(() => setLoading(false));
  }, [open, reportId]);

  async function handleReviewSubmit() {
    if (!report) return;
    setReviewError(null);

    if (reviewAction === "request_correction" && reviewComment.trim() === "") {
      setReviewError("Please provide comments describing the changes required.");
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewReport(report.id, reviewAction, reviewComment.trim());
      toast.success(
        reviewAction === "approved"
          ? "Report successfully approved!"
          : "Correction request sent to team member.",
      );
      // Reload report details
      const updated = await getReport(report.id);
      setReport(updated);
      setReviewComment("");
      onReviewSuccess?.();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const totalHours =
    report?.hoursWorked?.reduce((sum, h) => sum + Number(h.hours || 0), 0) ?? 0;
  const keyBlockers =
    report?.blockers?.filter((b) => b.isKeyIssue).length ?? 0;
  const keyAchievements =
    report?.achievements?.filter((a) => a.isKeyAchievement).length ?? 0;
  const completedTasks =
    report?.tasks?.filter((t) => t.status === "completed").length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
        {loading ? (
          <div className="flex h-80 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-[#4263A3]" />
            Loading report contents…
          </div>
        ) : error || !report ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p className="text-[#C85C5C]">{error ?? "Report not found."}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Modal Header */}
            <DialogHeader className="border-b border-[#E1E6ED] bg-[#F8FAFC] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#4263A3]/10 text-sm font-bold text-[#4263A3]">
                    {report.userName
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-[#18202F]">
                      {report.userName}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      Week of {formatDate(report.weekStartDate)} –{" "}
                      {formatDate(report.weekEndDate)}
                      {report.projectName ? ` · Project: ${report.projectName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_COLORS[report.status],
                    )}
                  >
                    {STATUS_LABELS[report.status]}
                  </span>
                  <span className="rounded-full bg-white border border-[#E1E6ED] px-2 py-0.5 text-xs font-medium text-[#38404F]">
                    v{report.versionNumber}
                  </span>
                  <a
                    href={`/reports/${encodeId(report.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-[#4263A3] transition-colors hover:bg-[#4263A3]/10"
                  >
                    Full Page <ExternalLink className="ml-1 size-3" />
                  </a>
                </div>
              </div>

              {/* KPI Chips */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-[#E1E6ED] bg-white p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListChecks className="size-3.5 text-[#4263A3]" />
                    Tasks Completed
                  </div>
                  <p className="mt-1 text-base font-bold text-[#18202F]">
                    {completedTasks} / {report.tasks?.length ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E1E6ED] bg-white p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5 text-[#4263A3]" />
                    Hours Logged
                  </div>
                  <p className="mt-1 text-base font-bold text-[#18202F]">
                    {totalHours}h
                  </p>
                </div>
                <div className="rounded-lg border border-[#E1E6ED] bg-white p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertTriangle className="size-3.5 text-amber-500" />
                    Key Blockers
                  </div>
                  <p className="mt-1 text-base font-bold text-[#18202F]">
                    {keyBlockers}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E1E6ED] bg-white p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="size-3.5 text-green-600" />
                    Achievements
                  </div>
                  <p className="mt-1 text-base font-bold text-[#18202F]">
                    {keyAchievements}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Notes banner if any */}
            {report.notes && (
              <div className="border-b border-[#E1E6ED] bg-[#FFFBEB] px-6 py-3 text-xs text-[#92400E]">
                <span className="font-semibold">Notes from team member: </span>
                {report.notes}
              </div>
            )}

            {/* Body Tabs */}
            <div className="p-5 sm:p-6">
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-5 text-xs">
                  <TabsTrigger value="tasks">
                    Tasks ({report.tasks?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="next_week">
                    Next Week ({report.nextWeekTasks?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="blockers">
                    Blockers ({report.blockers?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="achievements">
                    Wins ({report.achievements?.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="hours">
                    Hours ({report.hoursWorked?.length ?? 0})
                  </TabsTrigger>
                </TabsList>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="mt-0">
                  {report.tasks && report.tasks.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-[#E1E6ED]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Task</TableHead>
                            <TableHead className="text-xs">Priority</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Progress</TableHead>
                            <TableHead className="text-xs">Hours (Plan/Spent)</TableHead>
                            <TableHead className="text-xs">Deliverable</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.tasks.map((task, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-xs text-[#18202F]">
                                {task.taskName}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    task.priority === "critical" || task.priority === "high"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-[10px] capitalize"
                                >
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs capitalize text-muted-foreground">
                                {task.status.replace(/_/g, " ")}
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Act: {task.actualPercent}%</span>
                                    <span>Plan: {task.plannedPercent}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full bg-[#4263A3] rounded-full"
                                      style={{ width: `${Math.min(task.actualPercent, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {task.timePlanned != null || task.timeSpent != null ? (
                                  <span>
                                    {task.timePlanned ?? 0}h / {task.timeSpent ?? 0}h
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                                {task.deliverable || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No tasks reported for this week.
                    </p>
                  )}
                </TabsContent>

                {/* Next Week Tab */}
                <TabsContent value="next_week" className="mt-0">
                  {report.nextWeekTasks && report.nextWeekTasks.length > 0 ? (
                    <div className="space-y-2">
                      {report.nextWeekTasks.map((task, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-[#E1E6ED] bg-[#F8FAFC] p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Target className="size-4 text-[#4263A3]" />
                            <span className="font-medium text-[#18202F]">
                              {task.taskName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                task.priority === "critical" || task.priority === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px] capitalize"
                            >
                              {task.priority}
                            </Badge>
                            <span className="text-muted-foreground capitalize">
                              {task.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No next week tasks planned.
                    </p>
                  )}
                </TabsContent>

                {/* Blockers Tab */}
                <TabsContent value="blockers" className="mt-0">
                  {report.blockers && report.blockers.length > 0 ? (
                    <div className="space-y-2.5">
                      {report.blockers.map((b, i) => (
                        <div
                          key={i}
                          className={cn(
                            "rounded-lg border p-3.5 text-xs transition-colors",
                            b.isKeyIssue
                              ? "border-red-200 bg-red-50/60"
                              : "border-[#E1E6ED] bg-white",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              className={cn(
                                "size-4 mt-0.5 shrink-0",
                                b.isKeyIssue ? "text-red-600" : "text-amber-500",
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    "font-medium",
                                    b.isKeyIssue ? "text-red-900" : "text-[#18202F]",
                                  )}
                                >
                                  {b.description}
                                </p>
                                {b.isKeyIssue && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                    Critical Blocker
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-6 text-center text-xs text-green-700">
                      <CheckCircle2 className="size-5 mx-auto mb-1 text-green-600" />
                      No blockers reported — everything was smooth sailing!
                    </div>
                  )}
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="mt-0">
                  {report.achievements && report.achievements.length > 0 ? (
                    <div className="space-y-2.5">
                      {report.achievements.map((a, i) => (
                        <div
                          key={i}
                          className={cn(
                            "rounded-lg border p-3.5 text-xs transition-colors",
                            a.isKeyAchievement
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-[#E1E6ED] bg-white",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Lightbulb
                              className={cn(
                                "size-4 mt-0.5 shrink-0",
                                a.isKeyAchievement
                                  ? "text-emerald-600"
                                  : "text-[#4263A3]",
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={cn(
                                    "font-medium",
                                    a.isKeyAchievement
                                      ? "text-emerald-900"
                                      : "text-[#18202F]",
                                  )}
                                >
                                  {a.description}
                                </p>
                                {a.isKeyAchievement && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    Key Milestone
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No achievements recorded for this period.
                    </p>
                  )}
                </TabsContent>

                {/* Hours Tab */}
                <TabsContent value="hours" className="mt-0">
                  {report.hoursWorked && report.hoursWorked.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-[#E1E6ED]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Category</TableHead>
                            <TableHead className="text-right text-xs">Hours</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.hoursWorked.map((h, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-medium text-[#18202F]">
                                {h.category}
                              </TableCell>
                              <TableCell className="text-right text-xs font-semibold text-[#18202F]">
                                {h.hours}h
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-[#F8FAFC] font-bold">
                            <TableCell className="text-xs">Total Logged</TableCell>
                            <TableCell className="text-right text-xs text-[#4263A3]">
                              {totalHours}h
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No hours logged.
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              {/* Review Timeline History */}
              {report.reviews && report.reviews.length > 0 && (
                <div className="mt-6 rounded-lg border border-[#E1E6ED] bg-[#F8FAFC] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18202F]">
                    <History className="size-3.5 text-[#4263A3]" />
                    Review & Correction History
                  </div>
                  <div className="mt-3 space-y-2">
                    {report.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-md border border-[#E1E6ED] bg-white p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#18202F]">
                            {rev.reviewerName}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              rev.action === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700",
                            )}
                          >
                            {rev.action === "approved" ? "Approved" : "Requested Changes"}
                          </span>
                        </div>
                        {rev.comment && (
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                            {rev.comment}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleString()} · v{rev.versionNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager Review Action Card */}
              {canReview && (
                <div className="mt-6 rounded-xl border-2 border-[#4263A3]/20 bg-blue-50/20 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4263A3]">
                    Take Manager Review Action
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Review and provide feedback for {report.userName}&apos;s report.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction("approved")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-colors",
                        reviewAction === "approved"
                          ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
                          : "border-[#E1E6ED] bg-white text-muted-foreground hover:bg-[#F5F7FA]",
                      )}
                    >
                      <CheckCircle2 className="size-4 text-green-600" />
                      Approve Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("request_correction")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-colors",
                        reviewAction === "request_correction"
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm"
                          : "border-[#E1E6ED] bg-white text-muted-foreground hover:bg-[#F5F7FA]",
                      )}
                    >
                      <RotateCcw className="size-4 text-yellow-600" />
                      Request Changes
                    </button>
                  </div>

                  <div className="mt-3 space-y-1">
                    <label
                      htmlFor="review-feedback"
                      className="text-[11px] font-medium text-muted-foreground"
                    >
                      {reviewAction === "request_correction" ? (
                        <span className="text-yellow-800 font-semibold">
                          Correction details (required):
                        </span>
                      ) : (
                        "Feedback or comments (optional):"
                      )}
                    </label>
                    <Textarea
                      id="review-feedback"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={
                        reviewAction === "request_correction"
                          ? "e.g. Please clarify the deliverable links and update actual progress on task 2."
                          : "Great work this week! Everything is on track."
                      }
                      className="min-h-20 text-xs bg-white"
                    />
                  </div>

                  {reviewError && (
                    <p className="mt-2 text-xs text-[#C85C5C]">{reviewError}</p>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={submittingReview}
                      onClick={handleReviewSubmit}
                      className={
                        reviewAction === "approved"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-[#4263A3] text-white hover:bg-[#344F85]"
                      }
                    >
                      {submittingReview && (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      )}
                      {reviewAction === "approved"
                        ? "Approve Report"
                        : "Send Changes Request"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
