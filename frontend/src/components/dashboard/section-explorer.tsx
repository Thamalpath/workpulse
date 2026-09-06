"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flag,
  Lightbulb,
  ListChecks,
  Loader2,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SECTION_LABELS,
  TEAM_STATUS_COLORS,
  TEAM_STATUS_LABELS,
  getTeamSections,
  type ReportTask,
  type TeamSectionGroup,
  type TeamSectionKey,
} from "@/services/report.service";
import { cn } from "@/lib/utils";

const SECTIONS: TeamSectionKey[] = [
  "blockers",
  "achievements",
  "tasks",
  "next_week_tasks",
  "hours",
];

const SECTION_ICONS: Record<TeamSectionKey, React.ComponentType<{ className?: string }>> = {
  blockers: AlertTriangle,
  achievements: Lightbulb,
  tasks: ListChecks,
  next_week_tasks: Target,
  hours: Clock3,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-600",
  completed: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

type SectionExplorerProps = {
  from: string;
  to: string;
  projectId?: string;
  memberId?: string;
  category?: string;
  onOpenReport?: (reportId: string) => void;
};

function TaskItems({ items }: { items: unknown[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const task = item as ReportTask;
        return (
          <li key={index} className="rounded-lg border border-[#E1E6ED] bg-white p-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-[#18202F]">{task.taskName}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-600",
                )}
              >
                {task.priority}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                  TASK_STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600",
                )}
              >
                {task.status?.replace("_", " ")}
              </span>
              <span>Act: {task.actualPercent}% · Plan: {task.plannedPercent}%</span>
              {(task.timePlanned != null || task.timeSpent != null) && (
                <span>
                  {task.timePlanned != null ? `${task.timePlanned}h planned` : ""}
                  {task.timeSpent != null ? ` · ${task.timeSpent}h spent` : ""}
                </span>
              )}
            </div>
            {task.deliverable ? (
              <p className="mt-2 truncate text-xs text-[#4263A3]" title={task.deliverable}>
                📎 {task.deliverable}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function NextWeekTaskItems({ items }: { items: unknown[] }) {
  const rows = items as { taskName: string; priority: string; status: string }[];
  return (
    <ul className="space-y-2">
      {rows.map((row, index) => (
        <li
          key={index}
          className="flex items-start justify-between gap-2 rounded-lg border border-[#E1E6ED] bg-white p-2.5 text-xs"
        >
          <p className="font-medium text-[#18202F]">{row.taskName}</p>
          <div className="flex shrink-0 gap-1">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                PRIORITY_COLORS[row.priority] ?? "bg-gray-100 text-gray-600",
              )}
            >
              {row.priority}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                TASK_STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600",
              )}
            >
              {row.status?.replace("_", " ")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BlockerItems({ items }: { items: unknown[] }) {
  const rows = items as { description: string; isKeyIssue: boolean }[];
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/60 p-3 text-xs text-green-700">
        <CheckCircle2 className="size-4 shrink-0 text-green-600" />
        No blockers reported
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((row, index) => (
        <li
          key={index}
          className={cn(
            "rounded-lg border p-3 text-xs transition-colors",
            row.isKeyIssue
              ? "border-red-200 bg-red-50/70"
              : "border-[#E1E6ED] bg-white",
          )}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className={cn(
                "size-4 shrink-0 mt-0.5",
                row.isKeyIssue ? "text-red-600" : "text-amber-500",
              )}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p
                  className={cn(
                    "font-medium leading-snug",
                    row.isKeyIssue ? "text-red-950 font-semibold" : "text-[#18202F]",
                  )}
                >
                  {row.description}
                </p>
                {row.isKeyIssue && (
                  <span className="shrink-0 rounded-full bg-red-200/80 px-1.5 py-0.2 text-[9px] font-bold text-red-800 uppercase">
                    Critical
                  </span>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AchievementItems({ items }: { items: unknown[] }) {
  const rows = items as { description: string; isKeyAchievement: boolean }[];
  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No achievements listed.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((row, index) => (
        <li
          key={index}
          className={cn(
            "rounded-lg border p-3 text-xs transition-colors",
            row.isKeyAchievement
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-[#E1E6ED] bg-white",
          )}
        >
          <div className="flex items-start gap-2">
            <Lightbulb
              className={cn(
                "size-4 shrink-0 mt-0.5",
                row.isKeyAchievement ? "text-emerald-600" : "text-[#4263A3]",
              )}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p
                  className={cn(
                    "font-medium leading-snug",
                    row.isKeyAchievement
                      ? "text-emerald-950 font-semibold"
                      : "text-[#18202F]",
                  )}
                >
                  {row.description}
                </p>
                {row.isKeyAchievement && (
                  <span className="shrink-0 rounded-full bg-emerald-200/80 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 uppercase flex items-center gap-0.5">
                    <Sparkles className="size-2.5" /> Key Win
                  </span>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HoursItems({ items }: { items: unknown[] }) {
  const rows = items as { category: string; hours: number }[];
  const total = rows.reduce((sum, row) => sum + row.hours, 0);
  return (
    <div className="rounded-lg border border-[#E1E6ED] bg-white p-3">
      <ul className="space-y-1.5 text-xs">
        {rows.map((row, index) => (
          <li key={index} className="flex items-center justify-between gap-2">
            <span className="text-[#38404F]">{row.category}</span>
            <span className="font-semibold text-[#18202F]">{row.hours}h</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-[#E1E6ED] pt-2 text-xs">
        <span className="font-medium text-muted-foreground">Total Logged</span>
        <span className="font-bold text-[#4263A3] text-sm">{total}h</span>
      </div>
    </div>
  );
}

export function SectionExplorer({
  from,
  to,
  projectId,
  memberId,
  category,
  onOpenReport,
}: SectionExplorerProps) {
  const [section, setSection] = useState<TeamSectionKey>("blockers");
  const [groups, setGroups] = useState<TeamSectionGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return getTeamSections({
      from,
      to,
      section,
      ...(projectId ? { projectId } : {}),
      ...(memberId ? { memberId } : {}),
      ...(category ? { category } : {}),
    })
      .then(setGroups)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load sections."),
      )
      .finally(() => setLoading(false));
  }, [from, to, section, projectId, memberId, category]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.userName.toLowerCase().includes(q) ||
      (g.projectName && g.projectName.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Navigation Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map((key) => {
            const Icon = SECTION_ICONS[key];
            const active = section === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "border-[#4263A3] bg-[#4263A3] text-white shadow-xs"
                    : "border-[#E1E6ED] bg-white text-muted-foreground hover:text-[#18202F] hover:bg-[#F5F7FA]",
                )}
              >
                <Icon className="size-3.5" />
                {SECTION_LABELS[key]}
              </button>
            );
          })}
        </div>

        {/* In-view search */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member or project…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin text-[#4263A3]" /> Loading section comparisons…
        </div>
      ) : error ? (
        <p className="mt-4 text-xs text-[#C85C5C]">{error}</p>
      ) : filteredGroups.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#E1E6ED] p-8 text-center">
          <p className="text-xs text-muted-foreground">
            No entries found for {SECTION_LABELS[section].toLowerCase()} in this view.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <div
              key={group.reportId}
              className="flex flex-col justify-between rounded-xl border border-[#E1E6ED] bg-[#F8FAFC] p-4 transition-all hover:border-[#4263A3]/40 hover:shadow-sm"
            >
              <div>
                {/* Member header in card */}
                <div className="flex items-center justify-between gap-2 border-b border-[#E1E6ED]/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#4263A3]/10 text-xs font-bold text-[#4263A3]">
                      {group.userName
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#18202F]">
                        {group.userName}
                      </p>
                      {group.projectName ? (
                        <p className="text-[11px] text-muted-foreground">
                          {group.projectName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      TEAM_STATUS_COLORS[group.status],
                    )}
                  >
                    {TEAM_STATUS_LABELS[group.status]}
                  </span>
                </div>

                {/* Section specific content */}
                <div className="mt-3">
                  {section === "tasks" ? (
                    <TaskItems items={group.items} />
                  ) : section === "next_week_tasks" ? (
                    <NextWeekTaskItems items={group.items} />
                  ) : section === "blockers" ? (
                    <BlockerItems items={group.items} />
                  ) : section === "achievements" ? (
                    <AchievementItems items={group.items} />
                  ) : (
                    <HoursItems items={group.items} />
                  )}
                </div>
              </div>

              {/* Action footer */}
              {onOpenReport && (
                <div className="mt-4 flex items-center justify-end border-t border-[#E1E6ED]/80 pt-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenReport(group.reportId)}
                    className="h-7 text-xs font-medium text-[#4263A3] hover:bg-[#4263A3]/10"
                  >
                    Inspect Full Report <ArrowRight className="ml-1 size-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}