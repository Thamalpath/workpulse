"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  FilterX,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { AnalyticsKpiCards } from "@/components/analytics/analytics-kpi-cards";
import { CategoryTimeChart } from "@/components/analytics/category-time-chart";
import { MemberStatusChart } from "@/components/analytics/member-status-chart";
import { ProjectWorkloadChart } from "@/components/analytics/project-workload-chart";
import { RecentActivityFeed } from "@/components/analytics/recent-activity-feed";
import { TasksTrendChart } from "@/components/analytics/tasks-trend-chart";
import { TeamDateFilter } from "@/components/dashboard/team-date-filter";
import { FullPageLoader } from "@/components/loader";
import { ReportDetailDialog } from "@/components/reports/report-detail-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { addDays, formatDate, startOfWeek, toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  getAnalyticsOverview,
  type AnalyticsOverview,
} from "@/services/analytics.service";
import { getProjects, type Project } from "@/services/project.service";
import { getTeamWeekly, type TeamRosterMember } from "@/services/report.service";

export default function InsightsPage() {
  const { permissions } = useAuth();
  const canViewAll = permissions.includes("report.view.all");
  const canReview = permissions.includes("report.approve");

  // Initial window: past 8 weeks to current Sunday
  const initialRange = useMemo(() => {
    const monday = startOfWeek(new Date());
    const sunday = addDays(monday, 6);
    const eightWeeksAgo = addDays(monday, -49);
    return { from: toISODate(eightWeeksAgo), to: toISODate(sunday) };
  }, []);

  const [startDate, setStartDate] = useState(initialRange.from);
  const [endDate, setEndDate] = useState(initialRange.to);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamRosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Inspection modal
  const [inspectedReportId, setInspectedReportId] = useState<string | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  const fetchOverview = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setRefreshing(true);
      try {
        const data = await getAnalyticsOverview({
          from: startDate,
          to: endDate,
          projectId: projectFilter !== "all" ? projectFilter : undefined,
          memberId: memberFilter !== "all" ? memberFilter : undefined,
        });
        setOverview(data);
      } catch {
        setOverview(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [startDate, endDate, projectFilter, memberFilter],
  );

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    void getProjects()
      .then(setProjects)
      .catch(() => setProjects([]));

    void getTeamWeekly()
      .then((res) => {
        if (res?.members) setMembers(res.members);
      })
      .catch(() => setMembers([]));
  }, []);

  function handleDateChange(from: string, to: string) {
    setStartDate(from);
    setEndDate(to);
  }

  function handleOpenReport(id: string) {
    setInspectedReportId(id);
    setInspectModalOpen(true);
  }

  function clearFilters() {
    setProjectFilter("all");
    setMemberFilter("all");
  }

  const hasFilters = projectFilter !== "all" || memberFilter !== "all";

  if (loading) {
    return <FullPageLoader />;
  }

  const rangeText = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
              Dashboard & Visual Insights
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Sparkles className="size-3" /> Data Analytics
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Data-driven intelligence on task completion velocity, submission compliance, project effort, and team blockers.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <TeamDateFilter
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOverview(false)}
            disabled={refreshing}
            className="size-9 shrink-0 text-muted-foreground hover:text-[#18202F]"
            title="Refresh analytics data"
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin text-[#4263A3]")}
            />
          </Button>
          <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs font-medium">
            <Link href="/dashboard">
              <LayoutDashboard className="size-3.5 text-[#4263A3]" />
              Operational Roster
            </Link>
          </Button>
        </div>
      </div>

      {/* Scope Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E1E6ED] bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-[#18202F] flex items-center gap-1.5">
            <FolderKanban className="size-3.5 text-[#4263A3]" /> Filter Scope:
          </span>

          {/* Project selector */}
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 w-44 text-xs bg-[#F8FAFC]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Member selector */}
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="h-8 w-44 text-xs bg-[#F8FAFC]">
              <SelectValue placeholder="All team members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team members</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-[#C85C5C] hover:bg-red-50 hover:text-red-700"
            >
              <FilterX className="mr-1 size-3.5" /> Reset filters
            </Button>
          )}
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          Analytics period: <span className="font-bold text-[#18202F]">{rangeText}</span>
        </span>
      </div>

      {overview ? (
        <>
          {/* Summary Metric KPI Cards */}
          <AnalyticsKpiCards
            summary={overview.summary}
            onFilterNeedsCorrection={() => {
              // Quick action: if manager clicks needs correction, direct to dashboard
            }}
          />

          {/* Charts Row 1: Tasks Trend & Member Submission Status */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <TasksTrendChart data={overview.tasksTrend} />
            <MemberStatusChart data={overview.memberStatus} />
          </div>

          {/* Charts Row 2: Project Workload & Time Spent by Category */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ProjectWorkloadChart data={overview.projectWorkload} />
            <CategoryTimeChart data={overview.categoryTime} />
          </div>

          {/* Activity Feed */}
          <RecentActivityFeed
            activities={overview.recentActivity}
            onInspectReport={handleOpenReport}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white py-20 text-center">
          <Loader2 className="size-10 text-[#596273]" />
          <p className="mt-3 text-sm font-medium text-[#18202F]">
            Could not load visual insights.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please verify your connection and switch timeframe filters.
          </p>
        </div>
      )}

      {/* Report Inspection Modal */}
      <ReportDetailDialog
        key={inspectedReportId ?? "closed"}
        reportId={inspectedReportId}
        open={inspectModalOpen}
        onOpenChange={setInspectModalOpen}
        canReview={canReview}
        onReviewSuccess={() => {
          void fetchOverview(true);
        }}
      />
    </div>
  );
}
