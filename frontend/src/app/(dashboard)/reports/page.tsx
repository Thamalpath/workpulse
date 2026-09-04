"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
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
import { useAuth } from "@/contexts/auth-context";
import { useConfirm } from "@/hooks/use-confirm";
import { encodeId } from "@/lib/id";
import {
  getMyReports,
  getAllReports,
  deleteReport,
  submitReport,
  approveReport,
  requestCorrection,
  type Report,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/services/report.service";

export default function ReportsPage() {
  const { permissions, user } = useAuth();
  const canViewAll = permissions.includes("report.view.all");
  const canCreate = permissions.includes("report.create");

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();

  const refresh = useCallback(async () => {
    try {
      const data = canViewAll ? await getAllReports() : await getMyReports();
      setReports(data);
    } catch {
      setReports([]);
    }
  }, [canViewAll]);

  useEffect(() => {
    void refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Delete report", message: "Delete this report? This cannot be undone.", destructive: true, confirmLabel: "Delete" }))) return;
    try {
      await deleteReport(id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete report.");
    }
  }

  async function handleSubmit(id: string) {
    if (!(await confirm({ title: "Submit report", message: "Submit this report for review?" }))) return;
    try {
      await submitReport(id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to submit report.");
    }
  }

  async function handleApprove(id: string) {
    if (!(await confirm({ title: "Approve report", message: "Approve this report?" }))) return;
    try {
      await approveReport(id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to approve report.");
    }
  }

  async function handleRequestCorrection(id: string) {
    if (!(await confirm({ title: "Request correction", message: "Request correction for this report?" }))) return;
    try {
      await requestCorrection(id);
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to request correction.");
    }
  }

  function formatDate(dateStr: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const d = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatWeekRange(start: string, end: string) {
    return `${formatDate(start)} — ${formatDate(end)}`;
  }

  if (loading) {
    return <FullPageLoader />;
  }

  const isManager = canViewAll && (permissions.includes("report.approve") || permissions.includes("role.view"));

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
              Weekly Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              {isManager
                ? "View and review team weekly reports."
                : "Manage your weekly reports."}
            </p>
          </div>
          {canCreate && (
            <Button
              asChild
              className="bg-[#4263A3] text-white hover:bg-[#344F85]"
            >
              <Link href="/reports/create">
                <Plus className="size-4" />
                New report
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead>Project</TableHead>
              {isManager && <TableHead>Author</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManager ? 6 : 5}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="size-10 text-[#596273]" />
                    <p className="mt-3 text-sm font-medium text-[#18202F]">
                      No reports yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {canCreate
                        ? "Create your first weekly report to get started."
                        : "No reports have been submitted."}
                    </p>
                    {canCreate && (
                      <Button asChild size="sm" className="mt-4 bg-[#4263A3] text-white hover:bg-[#344F85]">
                        <Link href="/reports/create">
                          <Plus className="size-4" /> New report
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const isOwn = String(report.userId) === String(user?.id);
                const canEditOwn = isOwn && (report.status === "draft" || report.status === "needs_correction");
                const canDeleteOwn = isOwn && report.status === "draft";
                const canSubmitOwn = isOwn && report.status === "draft";
                const canApprove = isManager && report.status === "submitted";
                const canCorrect = isManager && report.status === "submitted";

                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <p className="font-medium text-[#18202F]">
                        {formatWeekRange(report.weekStartDate, report.weekEndDate)}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.projectName ?? "—"}
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-muted-foreground">
                        {report.userName}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(report.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/reports/${encodeId(report.id)}`)}
                          aria-label="View report"
                        >
                          <ArrowRight className="size-4" />
                        </Button>
                        {canEditOwn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/reports/${encodeId(report.id)}/edit`)}
                            aria-label="Edit report"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canSubmitOwn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#4263A3]"
                            onClick={() => handleSubmit(report.id)}
                            aria-label="Submit report"
                          >
                            <Send className="size-4" />
                          </Button>
                        )}
                        {canApprove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => handleApprove(report.id)}
                            aria-label="Approve report"
                          >
                            <CheckCircle className="size-4" />
                          </Button>
                        )}
                        {canCorrect && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-yellow-600"
                            onClick={() => handleRequestCorrection(report.id)}
                            aria-label="Request correction"
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        )}
                        {canDeleteOwn && (
                          <Button
                            variant="ghostDestructive"
                            size="icon"
                            onClick={() => handleDelete(report.id)}
                            aria-label="Delete report"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {confirmNode}
    </div>
  );
}
