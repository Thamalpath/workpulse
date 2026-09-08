"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { Row } from "@tanstack/react-table";
import { FullPageLoader } from "@/components/loader";
import { ReviewDialog } from "@/components/reports/review-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useConfirm } from "@/hooks/use-confirm";
import { encodeId } from "@/lib/id";
import { formatDate } from "@/lib/date";
import {
  getMyReports,
  getAllReports,
  deleteReport,
  submitReport,
  reviewReport,
  type Report,
  type ReportStatus,
  type ReviewAction,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/services/report.service";

const STATUS_FILTERS: (ReportStatus | "all")[] = [
  "all",
  "draft",
  "submitted",
  "needs_correction",
  "approved",
];

export default function ReportsPage() {
  const { permissions, user } = useAuth();
  const canViewAll = permissions.includes("report.view.all");
  const canCreate = permissions.includes("report.create");

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [reviewTarget, setReviewTarget] = useState<Report | null>(null);
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();
  const initialFetchRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = canViewAll ? await getAllReports() : await getMyReports();
      setReports(data);
    } catch {
      setReports([]);
    }
  }, [canViewAll]);

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
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

  async function handleReview(action: ReviewAction, comment: string) {
    if (!reviewTarget) return;
    await reviewReport(reviewTarget.id, action, comment);
    await refresh();
  }

  function formatWeekRange(start: string, end: string) {
    return `${formatDate(start)} — ${formatDate(end)}`;
  }

  const isManager = canViewAll && (permissions.includes("report.approve") || permissions.includes("role.view"));

  const visibleReports = statusFilter === "all"
    ? reports
    : reports.filter((report) => report.status === statusFilter);

  const columns = useMemo<DataTableColumn<Report>[]>(() => {
    const actionsCell = ({ row }: { row: Row<Report> }) => {
      const report = row.original;
      const isOwn = String(report.userId) === String(user?.id);
      const canEditOwn = isOwn && (report.status === "draft" || report.status === "needs_correction");
      const canDeleteOwn = isOwn && report.status === "draft";
      const canSubmitOwn = isOwn && (report.status === "draft" || report.status === "needs_correction");
      const canReviewStatus = isManager && report.status === "submitted";

      return (
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
          {canReviewStatus && (
            <Button
              variant="ghost"
              size="icon"
              className="text-[#4263A3]"
              onClick={() => setReviewTarget(report)}
              aria-label="Review report"
            >
              <ClipboardCheck className="size-4" />
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
      );
    };

    const cols: DataTableColumn<Report>[] = [
      {
        accessorKey: "weekStartDate",
        header: "Week",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <p className="font-medium text-[#18202F]">
              {formatWeekRange(r.weekStartDate, r.weekEndDate)}
            </p>
          );
        },
      },
      {
        accessorKey: "projectName",
        header: "Project",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.projectName ?? "—"}</span>
        ),
      },
      ...(isManager
        ? [
            {
              accessorKey: "userName",
              header: "Author",
              cell: ({ row }: { row: Row<Report> }) => (
                <span className="text-muted-foreground">{row.original.userName}</span>
              ),
            } as DataTableColumn<Report>,
          ]
        : []),
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}
            >
              {STATUS_LABELS[r.status]}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-right">Actions</span>,
        cell: actionsCell,
        enableSorting: false,
        enableGlobalFilter: false,
      },
    ];
    return cols;
  }, [isManager, user, router, handleDelete, handleSubmit]);

  return (
    <div className="flex w-full flex-col gap-6">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {visibleReports.length} {visibleReports.length === 1 ? "report" : "reports"}
        </p>
        {isManager && (
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ReportStatus | "all")}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All statuses" : STATUS_LABELS[status as ReportStatus]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DataTable
        data={visibleReports}
        columns={columns}
        defaultPageSize={10}
        emptyMessage={
          <>
            <FileText className="size-10 text-[#596273]" />
            <p className="mt-3 text-sm font-medium text-[#18202F]">
              No reports yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canCreate
                ? "Create your first weekly report to get started."
                : "No reports match this filter."}
            </p>
            {canCreate && (
              <Button asChild size="sm" className="mt-4 bg-[#4263A3] text-white hover:bg-[#344F85]">
                <Link href="/reports/create">
                  <Plus className="size-4" /> New report
                </Link>
              </Button>
            )}
          </>
        }
        noResultsMessage="No reports match your search or filters."
      />

      <ReviewDialog
        key={reviewTarget?.id ?? "closed"}
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
        onReview={handleReview}
        defaultAction="request_correction"
      />

      {confirmNode}
    </div>
  );
}