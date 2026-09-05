"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getReportVersion,
  type ReportVersionDetail,
  type ReportVersionMeta,
} from "@/services/report.service";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { ReportVersionContent } from "./report-version-content";

type VersionHistoryProps = {
  reportId: string;
  versions: ReportVersionMeta[];
  currentVersionNumber: number;
  isUnderReview?: boolean;
};

export function VersionHistory({
  reportId,
  versions,
  currentVersionNumber,
  isUnderReview = false,
}: VersionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ReportVersionDetail>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(version: ReportVersionMeta) {
    setError(null);
    if (expandedId === version.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(version.id);
    if (details[version.id]) return;

    setLoadingId(version.id);
    try {
      const detail = await getReportVersion(reportId, version.id);
      setDetails((prev) => ({ ...prev, [version.id]: detail }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load this version.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Every submission creates a snapshot of this report. Past versions stay visible
        for review.
      </p>
      {error && <p className="text-sm text-[#C85C5C]">{error}</p>}
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No submitted versions yet. Submit the report to create the first version.
        </p>
      ) : (
        versions.map((version) => {
          const isLatest = version.versionNumber === currentVersionNumber;
          const isExpanded = expandedId === version.id;
          const isLoading = loadingId === version.id;
          const detail = details[version.id];

          return (
            <div
              key={version.id}
              className="overflow-hidden rounded-lg border border-[#E1E6ED] bg-white"
            >
              <button
                type="button"
                onClick={() => toggle(version)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F5F7FA]"
              >
                <ChevronRight
                  className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-90")}
                />
                <span className="flex-1 text-sm font-medium text-[#18202F]">
                  Version {version.versionNumber}
                </span>
                {isLatest && (
                  <Badge className="bg-[#4263A3] text-white hover:bg-[#344F85]">
                    {isUnderReview ? "Under review" : "Latest"}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Submitted {formatDateTime(version.createdAt)}
                </span>
                {isLoading && <Loader2 className="size-4 animate-spin text-[#4263A3]" />}
              </button>
              {isExpanded && (
                <div className="border-t border-[#E1E6ED] bg-[#FAFBFC] p-4">
                  {detail ? (
                    <ReportVersionContent version={detail} />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Loading version…
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}