"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  History,
  ListTree,
  MessageSquareWarning,
  Pencil,
  RotateCcw,
  Send,
  Star,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FullPageLoader } from "@/components/loader";
import { ReviewDialog } from "@/components/reports/review-dialog";
import { ReviewHistory } from "@/components/reports/review-history";
import { VersionHistory } from "@/components/reports/version-history";
import { useAuth } from "@/contexts/auth-context";
import { useConfirm } from "@/hooks/use-confirm";
import { decodeId, encodeId } from "@/lib/id";
import { formatDate } from "@/lib/date";
import {
  getReport,
  submitReport,
  reviewReport,
  type Report,
  type ReviewAction,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/services/report.service";

function formatWeekRange(start: string, end: string) {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { permissions, user } = useAuth();
  const canApprove = permissions.includes("report.approve");
  const [confirm, confirmNode] = useConfirm();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDefaultAction, setReviewDefaultAction] = useState<ReviewAction>("request_correction");
  const [reviewSession, setReviewSession] = useState(0);

  const fetchReport = useCallback(async () => {
    try {
      const resolvedParams = await params;
      const data = await getReport(decodeId(resolvedParams.id));
      setReport(data);
    } catch {
      setError("Report not found.");
      toast.error("Report not found.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  async function handleSubmit() {
    if (!report) return;
    if (!(await confirm({ title: "Submit report", message: "Submit this report for review?" }))) return;
    const resubmitting = report.status === "needs_correction";
    try {
      await submitReport(report.id);
      await fetchReport();
      toast.success(resubmitting ? "Report resubmitted." : "Report submitted for review.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report.");
    }
  }

  async function handleReview(action: ReviewAction, comment: string) {
    if (!report) return;
    try {
      await reviewReport(report.id, action, comment);
      await fetchReport();
      toast.success(
        action === "approved"
          ? "Report approved."
          : action === "request_correction"
            ? "Changes requested."
            : "Report reviewed.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save review.");
    }
  }

  function openReview(action: ReviewAction) {
    setReviewDefaultAction(action);
    setReviewSession((s) => s + 1);
    setReviewOpen(true);
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (error || !report) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <FileText className="size-10 text-[#596273]" />
        <p className="mt-3 text-sm text-muted-foreground">{error ?? "Report not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/reports"><ArrowLeft className="size-4" /> Back to reports</Link>
        </Button>
      </div>
    );
  }

  const isOwn = String(report.userId) === String(user?.id);
  const isManager = canApprove && !isOwn;
  const canEditOwn = isOwn && (report.status === "draft" || report.status === "needs_correction");
  const canSubmitOwn = isOwn && (report.status === "draft" || report.status === "needs_correction");
  const canReviewAction = isManager && report.status === "submitted";

  const totalHours = report.hoursWorked?.reduce((sum, h) => sum + h.hours, 0) ?? 0;
  const keyBlockers = report.blockers?.filter((b) => b.isKeyIssue).length ?? 0;
  const keyAchievements = report.achievements?.filter((a) => a.isKeyAchievement).length ?? 0;

  const latestCorrection =
    report.reviews?.find((r) => r.action === "request_correction") ?? null;

  const hasHistory =
    (report.reviews?.length ?? 0) > 0 || (report.versions?.length ?? 0) > 0 || isManager;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "notes", label: "Notes" },
    { id: "tasks", label: "Tasks" },
    { id: "next-week", label: "Next Week" },
    { id: "blockers", label: "Blockers" },
    { id: "achievements", label: "Achievements" },
    { id: "hours", label: "Hours" },
  ].filter((s) =>
    s.id === "overview" ||
    (s.id === "notes" && !!report.notes) ||
    (s.id === "tasks" && (report.tasks?.length ?? 0) > 0) ||
    (s.id === "next-week" && (report.nextWeekTasks?.length ?? 0) > 0) ||
    (s.id === "blockers" && (report.blockers?.length ?? 0) > 0) ||
    (s.id === "achievements" && (report.achievements?.length ?? 0) > 0) ||
    (s.id === "hours" && (report.hoursWorked?.length ?? 0) > 0),
  );

  if (hasHistory) {
    sections.push({ id: "reviews", label: "Reviews" });
    sections.push({ id: "versions", label: "Versions" });
  }

  const reviewCount = report.reviews?.length ?? 0;
  const versionCount = report.versions?.length ?? 0;
  const latestCorrectionCount = report.reviews?.filter((r) => r.action === "request_correction").length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 xl:max-w-6xl 2xl:max-w-[1600px]">
      {/* Header */}
      <div id="overview" className="flex scroll-mt-24 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/reports"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[#4263A3] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to reports
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
            Weekly Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatWeekRange(report.weekStartDate, report.weekEndDate)}
            {report.projectName && <span> · {report.projectName}</span>}
            {report.versionNumber > 0 && (
              <span> · Version {report.versionNumber}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
            {STATUS_LABELS[report.status]}
          </span>
          {canEditOwn && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/reports/${encodeId(report.id)}/edit`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
          )}
          {canSubmitOwn && (
            <Button size="sm" className="bg-[#4263A3] text-white hover:bg-[#344F85]" onClick={handleSubmit}>
              <Send className="size-4" /> {report.status === "needs_correction" ? "Resubmit" : "Submit"}
            </Button>
          )}
          {canReviewAction && (
            <>
              <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => openReview("approved")}>
                <CheckCircle className="size-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50" onClick={() => openReview("request_correction")}>
                <RotateCcw className="size-4" /> Request Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Needs correction banner (team member) */}
      {report.status === "needs_correction" && latestCorrection && (
        <div id="correction" className="scroll-mt-24 rounded-xl border border-yellow-300 bg-yellow-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800">
            <MessageSquareWarning className="size-4" />
            Changes requested by {latestCorrection.reviewerName}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#18202F]">
            {latestCorrection.comment}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Made against version {latestCorrection.versionNumber}
          </p>
          {canEditOwn && (
            <Button asChild size="sm" className="mt-3 bg-[#4263A3] text-white hover:bg-[#344F85]">
              <Link href={`/reports/${encodeId(report.id)}/edit`}>
                <Pencil className="size-4" /> Edit and resubmit
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Section Nav */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E1E6ED] bg-white p-2 shadow-sm">
        <ListTree className="ml-2 size-4 shrink-0 text-[#4263A3]" />
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#F5F7FA] hover:text-[#4263A3]"
          >
            {section.label}
          </a>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="size-4" />
            Tasks
          </div>
          <p className="mt-1 text-2xl font-bold text-[#18202F]">{report.tasks?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            Hours
          </div>
          <p className="mt-1 text-2xl font-bold text-[#18202F]">{totalHours}</p>
        </div>
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" />
            Key Blockers
          </div>
          <p className="mt-1 text-2xl font-bold text-[#18202F]">{keyBlockers}</p>
        </div>
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="size-4" />
            Key Achievements
          </div>
          <p className="mt-1 text-2xl font-bold text-[#18202F]">{keyAchievements}</p>
        </div>
      </div>

      {/* Notes */}
      {report.notes && (
        <div id="notes" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-2">Notes</h3>
          <p className="text-sm text-[#18202F] whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {/* Tasks Completed */}
      {report.tasks && report.tasks.length > 0 && (
        <div id="tasks" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Tasks Completed</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Deliverable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.tasks.map((task, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-[#18202F]">{task.taskName}</TableCell>
                  <TableCell>
                    <Badge variant={task.priority === "critical" || task.priority === "high" ? "destructive" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {task.status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>{task.plannedPercent}%</TableCell>
                  <TableCell>{task.actualPercent}%</TableCell>
                  <TableCell className="text-muted-foreground">{task.deliverable ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Next Week Tasks */}
      {report.nextWeekTasks && report.nextWeekTasks.length > 0 && (
        <div id="next-week" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Planned for Next Week</h3>
          <div className="grid gap-2 2xl:grid-cols-2">
            {report.nextWeekTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-[#F5F7FA] px-4 py-2.5">
                <Badge variant={task.priority === "critical" || task.priority === "high" ? "destructive" : "secondary"} className="shrink-0">
                  {task.priority}
                </Badge>
                <span className="flex-1 text-sm text-[#18202F]">{task.taskName}</span>
                <span className="text-xs text-muted-foreground">{task.status.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockers */}
      {report.blockers && report.blockers.length > 0 && (
        <div id="blockers" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Blockers / Challenges</h3>
          <div className="grid gap-2 2xl:grid-cols-2">
            {report.blockers.map((blocker, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-[#FFF7ED] border border-orange-200 px-4 py-3">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm text-[#18202F]">{blocker.description}</p>
                </div>
                {blocker.isKeyIssue && (
                  <Badge variant="destructive" className="shrink-0">Key Issue</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {report.achievements && report.achievements.length > 0 && (
        <div id="achievements" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Achievements / Highlights</h3>
          <div className="grid gap-2 2xl:grid-cols-2">
            {report.achievements.map((achievement, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <Star className="size-4 shrink-0 mt-0.5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm text-[#18202F]">{achievement.description}</p>
                </div>
                {achievement.isKeyAchievement && (
                  <Badge className="shrink-0 bg-green-600 text-white hover:bg-green-700">Key</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hours Worked */}
      {report.hoursWorked && report.hoursWorked.length > 0 && (
        <div id="hours" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Hours Worked</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.hoursWorked.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-[#18202F]">{h.category}</TableCell>
                  <TableCell className="text-right">{h.hours}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totalHours}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Review history */}
      {hasHistory && (
        <div id="reviews" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="size-4 text-[#4263A3]" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3]">
                Review History
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"} ·{" "}
              {latestCorrectionCount} {latestCorrectionCount === 1 ? "correction" : "corrections"}
            </span>
          </div>
          <ReviewHistory reviews={report.reviews ?? []} />
        </div>
      )}

      {/* Version history */}
      {hasHistory && (
        <div id="versions" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <History className="size-4 text-[#4263A3]" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3]">
              Version History
            </h3>
            <span className="text-xs text-muted-foreground">{versionCount} versions</span>
          </div>
          <VersionHistory
            reportId={report.id}
            versions={report.versions ?? []}
            currentVersionNumber={report.versionNumber}
            isUnderReview={report.status === "submitted"}
          />
        </div>
      )}

      {/* Meta */}
      <div className="rounded-xl border border-[#E1E6ED] bg-[#F5F7FA] p-4 text-xs text-muted-foreground flex items-center justify-between">
        <span>Report by {report.userName}</span>
        <span>Created {formatDate(report.createdAt)} · Updated {formatDate(report.updatedAt)}</span>
      </div>

      <ReviewDialog
        key={reviewSession}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onReview={handleReview}
        defaultAction={reviewDefaultAction}
      />

      {confirmNode}
    </div>
  );
}