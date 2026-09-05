"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { SummaryMetrics } from "@/services/analytics.service";
import { cn } from "@/lib/utils";

type AnalyticsKpiCardsProps = {
  summary: SummaryMetrics;
  onFilterNeedsCorrection?: () => void;
};

export function AnalyticsKpiCards({
  summary,
  onFilterNeedsCorrection,
}: AnalyticsKpiCardsProps) {
  const { totalSubmittedThisPeriod, compliance, needsCorrectionCount, blockers } =
    summary;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Total Reports Submitted */}
      <div className="rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reports Submitted
          </span>
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-[#4263A3]">
            <FileText className="size-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-[#18202F]">
            {totalSubmittedThisPeriod}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            in selected window
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <span>
            {compliance.submittedCount} team members delivered submissions
          </span>
        </div>
      </div>

      {/* 2. Submission Compliance Rate */}
      <div className="rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance Rate
          </span>
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="size-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-[#18202F]">
            {compliance.complianceRate}%
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              compliance.complianceRate >= 80
                ? "bg-emerald-100 text-emerald-800"
                : compliance.complianceRate >= 50
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800",
            )}
          >
            {compliance.complianceRate >= 80
              ? "Good"
              : compliance.complianceRate >= 50
                ? "Fair"
                : "Low"}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              compliance.complianceRate >= 80
                ? "bg-emerald-600"
                : compliance.complianceRate >= 50
                  ? "bg-amber-500"
                  : "bg-red-500",
            )}
            style={{ width: `${Math.min(compliance.complianceRate, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="text-emerald-700 font-medium">
            {compliance.submittedCount} submitted
          </span>
          <span>·</span>
          <span className="text-amber-700 font-medium">
            {compliance.pendingCount} pending
          </span>
          {compliance.lateCount > 0 && (
            <>
              <span>·</span>
              <span className="text-red-600 font-bold">
                {compliance.lateCount} late
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Reports in Needs Correction */}
      <div
        onClick={onFilterNeedsCorrection}
        className={cn(
          "rounded-xl border p-5 shadow-xs transition-all hover:shadow-md",
          needsCorrectionCount > 0
            ? "border-amber-200 bg-amber-50/40 cursor-pointer"
            : "border-[#E1E6ED] bg-white",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Needs Correction
          </span>
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              needsCorrectionCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500",
            )}
          >
            <RotateCcw className="size-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-[#18202F]">
            {needsCorrectionCount}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {needsCorrectionCount === 1 ? "report revision pending" : "report revisions pending"}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {needsCorrectionCount > 0
            ? "Requires review follow-up by submitter."
            : "All reviewed reports are resolved or approved."}
        </p>
      </div>

      {/* 4. Open Blockers Across Team */}
      <div
        className={cn(
          "rounded-xl border p-5 shadow-xs transition-all hover:shadow-md",
          blockers.criticalBlockers > 0
            ? "border-red-200 bg-red-50/30"
            : "border-[#E1E6ED] bg-white",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Open Team Blockers
          </span>
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              blockers.criticalBlockers > 0
                ? "bg-red-100 text-red-700"
                : "bg-amber-50 text-amber-600",
            )}
          >
            <AlertTriangle className="size-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-[#18202F]">
            {blockers.totalBlockers}
          </span>
          {blockers.criticalBlockers > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {blockers.criticalBlockers} Critical
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {blockers.criticalBlockers > 0
            ? `${blockers.criticalBlockers} key impediments require manager assistance.`
            : blockers.totalBlockers > 0
              ? "Minor friction items reported by team."
              : "No blockers currently recorded."}
        </p>
      </div>
    </div>
  );
}
