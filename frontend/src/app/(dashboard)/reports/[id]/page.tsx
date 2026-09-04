"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
  Star,
  Target,
  AlertTriangle,
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
import { useAuth } from "@/contexts/auth-context";
import {
  getReport,
  submitReport,
  approveReport,
  requestCorrection,
  type Report,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/services/report.service";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekRange(start: string, end: string) {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { permissions, user } = useAuth();
  const canApprove = permissions.includes("report.approve");

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const resolvedParams = await params;
      const data = await getReport(resolvedParams.id);
      setReport(data);
    } catch {
      setError("Report not found.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  async function handleSubmit() {
    if (!report) return;
    if (!window.confirm("Submit this report for review?")) return;
    try {
      await submitReport(report.id);
      await fetchReport();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to submit.");
    }
  }

  async function handleApprove() {
    if (!report) return;
    if (!window.confirm("Approve this report?")) return;
    try {
      await approveReport(report.id);
      await fetchReport();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to approve.");
    }
  }

  async function handleCorrection() {
    if (!report) return;
    if (!window.confirm("Request correction for this report?")) return;
    try {
      await requestCorrection(report.id);
      await fetchReport();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to request correction.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4263A3]" />
      </div>
    );
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
  const canEditOwn = isOwn && (report.status === "draft" || report.status === "needs_correction");
  const canSubmitOwn = isOwn && report.status === "draft";
  const canApproveAction = canApprove && report.status === "submitted";
  const canCorrectAction = canApprove && report.status === "submitted";

  const totalHours = report.hoursWorked?.reduce((sum, h) => sum + h.hours, 0) ?? 0;
  const keyBlockers = report.blockers?.filter((b) => b.isKeyIssue).length ?? 0;
  const keyAchievements = report.achievements?.filter((a) => a.isKeyAchievement).length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
            {STATUS_LABELS[report.status]}
          </span>
          {canEditOwn && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/reports/${report.id}/edit`}>
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
          )}
          {canSubmitOwn && (
            <Button size="sm" className="bg-[#4263A3] text-white hover:bg-[#344F85]" onClick={handleSubmit}>
              <Send className="size-4" /> Submit
            </Button>
          )}
          {canApproveAction && (
            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={handleApprove}>
              <CheckCircle className="size-4" /> Approve
            </Button>
          )}
          {canCorrectAction && (
            <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50" onClick={handleCorrection}>
              <RotateCcw className="size-4" /> Request Correction
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-2">Notes</h3>
          <p className="text-sm text-[#18202F] whitespace-pre-wrap">{report.notes}</p>
        </div>
      )}

      {/* Tasks Completed */}
      {report.tasks && report.tasks.length > 0 && (
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Planned for Next Week</h3>
          <div className="space-y-2">
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Blockers / Challenges</h3>
          <div className="space-y-2">
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3] mb-4">Achievements / Highlights</h3>
          <div className="space-y-2">
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 shadow-sm">
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

      {/* Meta */}
      <div className="rounded-xl border border-[#E1E6ED] bg-[#F5F7FA] p-4 text-xs text-muted-foreground flex items-center justify-between">
        <span>Report by {report.userName}</span>
        <span>Created {formatDate(report.createdAt)} · Updated {formatDate(report.updatedAt)}</span>
      </div>
    </div>
  );
}
