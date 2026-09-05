"use client";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
  RotateCcw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityItem } from "@/services/analytics.service";
import { cn } from "@/lib/utils";

type RecentActivityFeedProps = {
  activities: ActivityItem[];
  onInspectReport?: (reportId: string) => void;
};

function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return isoStr;
  }
}

export function RecentActivityFeed({
  activities,
  onInspectReport,
}: RecentActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white p-6 text-center text-xs text-muted-foreground">
        <Activity className="size-8 text-gray-300 mb-2" />
        No recent submission or review activity recorded.
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E1E6ED] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#18202F] text-sm sm:text-base">
              Recent Reports & Review Activity Feed
            </h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#4263A3]">
              Audit Stream
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time audit log of team report submissions and manager review actions
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-[#E1E6ED]/70 overflow-hidden">
        {activities.map((item) => {
          const isApproval = item.eventType === "approved";
          const isCorrection = item.eventType === "request_correction";
          const isSubmission = item.eventType === "submission";

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 text-xs transition-colors hover:bg-[#F8FAFC]/90 px-2 rounded-lg"
            >
              <div className="flex items-start gap-3">
                {/* Event Icon */}
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                    isApproval && "bg-emerald-100 text-emerald-700",
                    isCorrection && "bg-amber-100 text-amber-700",
                    isSubmission && "bg-blue-100 text-[#4263A3]",
                  )}
                >
                  {isApproval && <CheckCircle2 className="size-4" />}
                  {isCorrection && <RotateCcw className="size-4" />}
                  {isSubmission && <Send className="size-4" />}
                </div>

                {/* Event Description */}
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 font-medium text-[#18202F]">
                    {isApproval && (
                      <>
                        <span className="font-bold">{item.actorName}</span>
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                          Approved
                        </span>
                        <span>{item.targetUserName}&apos;s weekly report</span>
                      </>
                    )}
                    {isCorrection && (
                      <>
                        <span className="font-bold">{item.actorName}</span>
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                          Changes Requested
                        </span>
                        <span>on {item.targetUserName}&apos;s report</span>
                      </>
                    )}
                    {isSubmission && (
                      <>
                        <span className="font-bold">{item.actorName}</span>
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
                          Submitted
                        </span>
                        <span>weekly report</span>
                      </>
                    )}
                    {item.projectName && (
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.2 text-[10px] font-semibold text-gray-600">
                        {item.projectName}
                      </span>
                    )}
                  </div>

                  {item.comment && (
                    <p className="mt-1 line-clamp-1 italic text-muted-foreground bg-gray-50 px-2 py-0.5 rounded border border-[#E1E6ED]/50 max-w-xl">
                      &ldquo;{item.comment}&rdquo;
                    </p>
                  )}

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Week: {item.weekStartDate} to {item.weekEndDate}
                  </p>
                </div>
              </div>

              {/* Timestamp & Inspect action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatTimestamp(item.timestamp)}
                </span>
                {onInspectReport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInspectReport(item.reportId)}
                    className="h-7 text-xs font-semibold text-[#4263A3] hover:bg-blue-50 px-2"
                  >
                    Inspect <ArrowRight className="ml-1 size-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
