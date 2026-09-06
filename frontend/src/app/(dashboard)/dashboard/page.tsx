"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  FilterX,
  FolderKanban,
  Layers,
  LayoutGrid,
  LineChart,
  ListFilter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TableProperties,
  Tag,
  Users,
  XCircle,
} from "lucide-react";

import { TeamDateFilter } from "@/components/dashboard/team-date-filter";
import { SectionExplorer } from "@/components/dashboard/section-explorer";
import { ReportDetailDialog } from "@/components/reports/report-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FullPageLoader } from "@/components/loader";
import { useAuth } from "@/contexts/auth-context";
import { encodeId } from "@/lib/id";
import { formatDate, addDays, startOfWeek, toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  getTeamWeekly,
  getReportCategories,
  DEFAULT_HOURS_CATEGORIES,
  type Report,
  type TeamMemberStatus,
  type TeamRosterMember,
  type TeamWeeklyResponse,
  TEAM_STATUS_COLORS,
  TEAM_STATUS_LABELS,
} from "@/services/report.service";
import { getProjects, type Project } from "@/services/project.service";

const STATUS_FILTERS: (TeamMemberStatus | "all")[] = [
  "all",
  "submitted",
  "needs_correction",
  "approved",
  "draft",
  "not_started",
];

function deriveStatus(
  member: TeamRosterMember,
  projectId?: string,
): TeamMemberStatus {
  const scoped = projectId
    ? member.reports.filter((report) => report.projectId === projectId)
    : member.reports;
  const latest = scoped[scoped.length - 1];
  return latest?.status ?? "not_started";
}

function MetricKpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col text-left rounded-xl border p-4 shadow-xs transition-all duration-150 hover:shadow-md cursor-pointer",
        active
          ? "border-[#4263A3] bg-blue-50/50 ring-2 ring-[#4263A3]/20"
          : "border-[#E1E6ED] bg-white hover:border-[#4263A3]/40",
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            colorClass,
          )}
        >
          <Icon className="size-4.5" />
        </div>
        {active && (
          <span className="rounded-full bg-[#4263A3] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
            Active
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-[#18202F]">
        {value}
      </p>
      <div className="flex items-center justify-between w-full mt-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { permissions, user } = useAuth();
  const router = useRouter();
  const canViewAll = permissions.includes("report.view.all");
  const canReview = permissions.includes("report.approve");

  const initialWeek = useMemo(() => {
    const monday = startOfWeek(new Date());
    return { from: toISODate(monday), to: toISODate(addDays(monday, 6)) };
  }, []);

  // Time range state
  const [startDate, setStartDate] = useState(initialWeek.from);
  const [endDate, setEndDate] = useState(initialWeek.to);

  // Data state
  const [team, setTeam] = useState<TeamWeeklyResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_HOURS_CATEGORIES]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchInFlight = useRef(false);
  const auxFetchedRef = useRef(false);

  // Filter state
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TeamMemberStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Report detail & review modal
  const [inspectReportId, setInspectReportId] = useState<string | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // View state
  const [activeTab, setActiveTab] = useState<"roster" | "reports">("roster");

  const loadData = useCallback(
    async (isSilent = false) => {
      if (fetchInFlight.current) return;
      fetchInFlight.current = true;
      if (!isSilent) setRefreshing(true);
      try {
        const data = await getTeamWeekly({
          from: startDate,
          to: endDate,
          ...(projectFilter !== "all" ? { projectId: projectFilter } : {}),
          ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
        });
        setTeam(data);
      } catch {
        setTeam(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
        fetchInFlight.current = false;
      }
    },
    [startDate, endDate, projectFilter, categoryFilter],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (auxFetchedRef.current) return;
    auxFetchedRef.current = true;
    void getProjects()
      .then(setProjects)
      .catch(() => setProjects([]));

    void getReportCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch(() => setCategories([...DEFAULT_HOURS_CATEGORIES]));
  }, []);

  function handleDateChange(from: string, to: string) {
    setStartDate(from);
    setEndDate(to);
  }

  function handleOpenReport(reportId: string) {
    setInspectReportId(reportId);
    setInspectModalOpen(true);
  }

  function clearFilters() {
    setMemberFilter("all");
    setProjectFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  }

  const hasActiveFilters =
    memberFilter !== "all" ||
    projectFilter !== "all" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim() !== "";

  // Filtered Roster
  const filteredRoster: TeamRosterMember[] = useMemo(() => {
    if (!team) return [];
    return team.members.filter((member) => {
      // Member filter
      if (memberFilter !== "all" && member.id !== memberFilter) return false;

      // Status filter
      const derived = deriveStatus(
        member,
        projectFilter === "all" ? undefined : projectFilter,
      );
      if (statusFilter !== "all" && derived !== statusFilter) return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesEmail = member.email.toLowerCase().includes(q);
        const matchesProject = member.reports.some((r) =>
          r.projectName?.toLowerCase().includes(q),
        );
        if (!matchesName && !matchesEmail && !matchesProject) return false;
      }

      return true;
    });
  }, [team, memberFilter, projectFilter, statusFilter, searchQuery]);

  // Flattened reports list for "All Reports" view
  const allReportsList: Report[] = useMemo(() => {
    if (!team) return [];
    const list: Report[] = [];
    for (const member of team.members) {
      if (memberFilter !== "all" && member.id !== memberFilter) continue;
      for (const report of member.reports) {
        if (projectFilter !== "all" && report.projectId !== projectFilter) continue;
        if (statusFilter !== "all" && report.status !== statusFilter) continue;
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const matchesName = report.userName.toLowerCase().includes(q);
          const matchesProject =
            report.projectName?.toLowerCase().includes(q) ?? false;
          if (!matchesName && !matchesProject) continue;
        }
        list.push(report);
      }
    }
    return list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  }, [team, memberFilter, projectFilter, statusFilter, searchQuery]);

  // Dynamic KPI Metrics derived from active filters
  const metrics = useMemo(() => {
    if (!team) {
      return {
        total: 0,
        submitted: 0,
        approved: 0,
        needs_correction: 0,
        draft: 0,
        not_started: 0,
        completionRate: 0,
      };
    }
    const counts = {
      total: team.members.length,
      submitted: 0,
      approved: 0,
      needs_correction: 0,
      draft: 0,
      not_started: 0,
    };
    for (const m of team.members) {
      const st = deriveStatus(
        m,
        projectFilter === "all" ? undefined : projectFilter,
      );
      counts[st] += 1;
    }
    const started = counts.total - counts.not_started;
    const completionRate =
      counts.total > 0 ? Math.round((started / counts.total) * 100) : 0;
    return { ...counts, completionRate };
  }, [team, projectFilter]);

  if (loading) {
    return <FullPageLoader />;
  }

  const rangeLabel = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header & Date Scope Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
              {canViewAll ? "Team Dashboard" : "Your Weekly Overview"}
            </h1>
            {canViewAll && (
              <span className="rounded-full bg-[#4263A3]/10 px-2.5 py-0.5 text-xs font-bold text-[#4263A3]">
                Manager View
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {canViewAll
              ? "Monitor team submissions, review pending reports, and track cross-functional blockers."
              : "Track your submission progress and review status for this week."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canViewAll && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 gap-1.5 text-xs font-semibold text-[#4263A3] border-[#4263A3]/30 hover:bg-blue-50"
            >
              <Link href="/insights">
                <LineChart className="size-3.5" />
                Visual Insights
              </Link>
            </Button>
          )}
          <TeamDateFilter
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="size-9 shrink-0 text-muted-foreground hover:text-[#18202F]"
            title="Refresh dashboard data"
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin text-[#4263A3]")}
            />
          </Button>
        </div>
      </div>

      {team ? (
        <>
          {/* Interactive Metric KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
            <MetricKpiCard
              label="Team Members"
              value={metrics.total}
              subtitle={`${metrics.completionRate}% reported`}
              icon={Users}
              colorClass="bg-[#4263A3]/10 text-[#4263A3]"
              active={statusFilter === "all" && !hasActiveFilters}
              onClick={() => setStatusFilter("all")}
            />
            <MetricKpiCard
              label="Submitted"
              value={metrics.submitted}
              subtitle="Pending review"
              icon={FileText}
              colorClass="bg-blue-100 text-blue-700"
              active={statusFilter === "submitted"}
              onClick={() =>
                setStatusFilter((cur) => (cur === "submitted" ? "all" : "submitted"))
              }
            />
            <MetricKpiCard
              label="Approved"
              value={metrics.approved}
              subtitle="Signed off"
              icon={CheckCircle2}
              colorClass="bg-[#3C8C7A]/15 text-[#3C8C7A]"
              active={statusFilter === "approved"}
              onClick={() =>
                setStatusFilter((cur) => (cur === "approved" ? "all" : "approved"))
              }
            />
            <MetricKpiCard
              label="Needs Correction"
              value={metrics.needs_correction}
              subtitle="Changes requested"
              icon={RotateCcw}
              colorClass="bg-yellow-100 text-yellow-700"
              active={statusFilter === "needs_correction"}
              onClick={() =>
                setStatusFilter((cur) =>
                  cur === "needs_correction" ? "all" : "needs_correction",
                )
              }
            />
            <MetricKpiCard
              label="Draft"
              value={metrics.draft}
              subtitle="In progress"
              icon={FileCheck}
              colorClass="bg-purple-100 text-purple-700"
              active={statusFilter === "draft"}
              onClick={() =>
                setStatusFilter((cur) => (cur === "draft" ? "all" : "draft"))
              }
            />
            <MetricKpiCard
              label="Not Started"
              value={metrics.not_started}
              subtitle="No draft yet"
              icon={XCircle}
              colorClass="bg-gray-100 text-gray-500"
              active={statusFilter === "not_started"}
              onClick={() =>
                setStatusFilter((cur) =>
                  cur === "not_started" ? "all" : "not_started",
                )
              }
            />
          </div>

          {/* Main Dashboard Workspace */}
          <div className="flex flex-col gap-6">
            {/* Filter Toolbar Card */}
            <div className="rounded-xl border border-[#E1E6ED] bg-white p-4 shadow-xs">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search member or project…"
                      className="h-8 pl-8 text-xs bg-[#F8FAFC]"
                    />
                  </div>

                  {/* Member filter */}
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger className="h-8 w-44 text-xs bg-[#F8FAFC]">
                      <SelectValue placeholder="All members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All members</SelectItem>
                      {team.members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Project filter */}
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="h-8 w-44 text-xs bg-[#F8FAFC]">
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Category filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 w-44 text-xs bg-[#F8FAFC]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Status filter */}
                  <Select
                    value={statusFilter}
                    onValueChange={(val) =>
                      setStatusFilter(val as TeamMemberStatus | "all")
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs bg-[#F8FAFC]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTERS.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st === "all"
                            ? "All statuses"
                            : TEAM_STATUS_LABELS[st as TeamMemberStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Reset Filters button */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs text-[#C85C5C] hover:bg-red-50 hover:text-red-700"
                    >
                      <FilterX className="mr-1 size-3.5" /> Clear filters
                    </Button>
                  )}
                </div>

                {/* View switcher Tabs */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={activeTab === "roster" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("roster")}
                    className={cn(
                      "h-8 text-xs font-semibold gap-1.5",
                      activeTab === "roster"
                        ? "bg-[#4263A3] text-white hover:bg-[#355187]"
                        : "",
                    )}
                  >
                    <TableProperties className="size-3.5" />
                    Roster Matrix
                  </Button>
                  <Button
                    variant={activeTab === "reports" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("reports")}
                    className={cn(
                      "h-8 text-xs font-semibold gap-1.5",
                      activeTab === "reports"
                        ? "bg-[#4263A3] text-white hover:bg-[#355187]"
                        : "",
                    )}
                  >
                    <FileText className="size-3.5" />
                    All Reports ({allReportsList.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* TAB 1: Roster Status Matrix */}
            {activeTab === "roster" && (
              <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E6ED] px-5 py-4 bg-[#F8FAFC]">
                  <div>
                    <h2 className="font-semibold text-[#18202F] text-sm">
                      Team Roster & Submission Status · {rangeLabel}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredRoster.length} of {team.summary.total} team members
                    </p>
                  </div>
                  {metrics.submitted > 0 && canReview && (
                    <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      <AlertCircle className="size-3.5" />
                      {metrics.submitted} report{metrics.submitted === 1 ? "" : "s"} waiting for your review
                    </div>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Team Member</TableHead>
                      <TableHead className="text-xs">Associated Project(s)</TableHead>
                      <TableHead className="text-xs">Submission Status</TableHead>
                      <TableHead className="text-xs">Reports</TableHead>
                      <TableHead className="text-right text-xs">Review & Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoster.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="size-9 text-muted-foreground" />
                            <p className="mt-2 text-sm font-semibold text-[#18202F]">
                              No team members match the criteria
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Try clearing filters or adjusting your date range.
                            </p>
                            {hasActiveFilters && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="mt-3 text-xs"
                              >
                                Clear all filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoster.map((member) => {
                        const status = deriveStatus(
                          member,
                          projectFilter === "all" ? undefined : projectFilter,
                        );
                        const latest = member.reports.length
                          ? member.reports[member.reports.length - 1]
                          : null;
                        const projectNames = Array.from(
                          new Set(
                            member.reports
                              .map((r) => r.projectName)
                              .filter((n): n is string => Boolean(n)),
                          ),
                        );
                        const isSelf = String(member.id) === String(user?.id);
                        const needsReview = status === "submitted" && latest;

                        return (
                          <TableRow key={member.id} className="hover:bg-[#F8FAFC]/80">
                            {/* Member cell */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex size-8.5 items-center justify-center rounded-full bg-[#4263A3]/10 text-xs font-bold text-[#4263A3]">
                                  {member.name
                                    .split(" ")
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#18202F]">
                                    {member.name}
                                    {isSelf && (
                                      <span className="rounded-full bg-[#4263A3]/10 px-1.5 py-0.2 text-[9px] font-bold text-[#4263A3]">
                                        you
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Project cell */}
                            <TableCell>
                              {projectNames.length > 0 ? (
                                <div className="flex max-w-64 flex-wrap gap-1">
                                  {projectNames.map((name) => (
                                    <span
                                      key={name}
                                      className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-0.5 text-[11px] font-medium text-[#38404F]"
                                    >
                                      <FolderKanban className="size-3 text-[#4263A3]" />
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            {/* Status cell */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    TEAM_STATUS_COLORS[status],
                                  )}
                                >
                                  {TEAM_STATUS_LABELS[status]}
                                </span>
                                {needsReview && canReview && (
                                  <span className="relative flex size-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex size-2 rounded-full bg-blue-600" />
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Reports count */}
                            <TableCell className="text-xs text-muted-foreground">
                              {member.reports.length === 0
                                ? "Not started"
                                : `${member.reports.length} report${
                                    member.reports.length === 1 ? "" : "s"
                                  }`}
                            </TableCell>

                            {/* Actions cell */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {needsReview && canReview ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenReport(latest.id)}
                                    className="h-7 bg-[#4263A3] text-white hover:bg-[#344F85] text-xs font-semibold px-2.5 shadow-xs"
                                  >
                                    Review Report
                                  </Button>
                                ) : latest ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenReport(latest.id)}
                                    className="h-7 text-xs font-medium"
                                  >
                                    Inspect Full Report
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic pr-2">
                                    Pending submission
                                  </span>
                                )}

                                {latest && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-muted-foreground hover:text-[#4263A3]"
                                    asChild
                                    title="Open report page"
                                  >
                                    <Link href={`/reports/${encodeId(latest.id)}`}>
                                      <ExternalLink className="size-3.5" />
                                    </Link>
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
            )}

            {/* TAB 2: All Reports Stream Feed */}
            {activeTab === "reports" && (
              <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E1E6ED] px-5 py-4 bg-[#F8FAFC]">
                  <div>
                    <h2 className="font-semibold text-[#18202F] text-sm">
                      Detailed Team Reports · {rangeLabel}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {allReportsList.length} report{allReportsList.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Report & Author</TableHead>
                      <TableHead className="text-xs">Project</TableHead>
                      <TableHead className="text-xs">Reporting Week</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Version</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReportsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="size-9 text-muted-foreground" />
                            <p className="mt-2 text-sm font-semibold text-[#18202F]">
                              No reports in this period
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Change date range or filter settings to view submissions.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allReportsList.map((r) => (
                        <TableRow key={r.id} className="hover:bg-[#F8FAFC]/80">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 items-center justify-center rounded-full bg-[#4263A3]/10 text-xs font-bold text-[#4263A3]">
                                {r.userName
                                  .split(" ")
                                  .map((p) => p[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#18202F]">
                                  {r.userName}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Updated {formatDate(r.updatedAt || r.createdAt)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {r.projectName ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-0.5 text-[11px] font-medium text-[#38404F]">
                                <FolderKanban className="size-3 text-[#4263A3]" />
                                {r.projectName}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-[#38404F]">
                            {formatDate(r.weekStartDate)} – {formatDate(r.weekEndDate)}
                          </TableCell>

                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                TEAM_STATUS_COLORS[r.status],
                              )}
                            >
                              {TEAM_STATUS_LABELS[r.status]}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs font-medium text-muted-foreground">
                            v{r.versionNumber}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleOpenReport(r.id)}
                                className={cn(
                                  "h-7 text-xs font-semibold",
                                  r.status === "submitted" && canReview
                                    ? "bg-[#4263A3] text-white hover:bg-[#344F85]"
                                    : "bg-white border border-[#E1E6ED] text-[#18202F] hover:bg-[#F5F7FA]",
                                )}
                              >
                                {r.status === "submitted" && canReview
                                  ? "Review"
                                  : "Inspect"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-[#4263A3]"
                                asChild
                              >
                                <Link href={`/reports/${encodeId(r.id)}`}>
                                  <ArrowRight className="size-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* SIDE-BY-SIDE SECTION COMPARISON (Bonus Feature) */}
            {canViewAll && (
              <div className="rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs">
                <div className="flex flex-col gap-1 border-b border-[#E1E6ED] pb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#18202F]">
                      Side-by-Side Section Analysis
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Cross-Team Comparison
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compare blockers, achievements, completed tasks, or hours logged across the whole team simultaneously without opening each report.
                  </p>
                </div>

                <div className="mt-4">
                  <SectionExplorer
                    key={`${startDate}-${endDate}-${memberFilter}-${projectFilter}-${categoryFilter}`}
                    from={startDate}
                    to={endDate}
                    projectId={projectFilter === "all" ? undefined : projectFilter}
                    memberId={memberFilter === "all" ? undefined : memberFilter}
                    category={categoryFilter === "all" ? undefined : categoryFilter}
                    onOpenReport={handleOpenReport}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white py-20 text-center">
          <Loader2 className="size-10 text-[#596273]" />
          <p className="mt-3 text-sm font-medium text-[#18202F]">
            Could not load the team dashboard.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please verify your connection and switch date ranges.
          </p>
        </div>
      )}

      {/* Complete Report Inspection & Review Action Dialog */}
      <ReportDetailDialog
        key={inspectReportId ?? "closed"}
        reportId={inspectReportId}
        open={inspectModalOpen}
        onOpenChange={setInspectModalOpen}
        canReview={canReview}
        onReviewSuccess={() => {
          void loadData(true);
        }}
      />
    </div>
  );
}