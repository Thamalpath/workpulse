"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FullPageLoader } from "@/components/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getReport,
  createReport,
  updateReport,
  type CreateReportInput,
  type ReportTask,
  type NextWeekTask,
  type Blocker,
  type Achievement,
  type HoursWorked,
} from "@/services/report.service";
import { getProjects, type Project } from "@/services/project.service";

function getCurrentWeekDates() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0]!,
    end: sunday.toISOString().split("T")[0]!,
  };
}

function emptyTask(): ReportTask {
  return {
    taskName: "",
    priority: "medium",
    plannedPercent: 0,
    actualPercent: 0,
    status: "not_started",
    timePlanned: undefined,
    timeSpent: undefined,
    deliverable: undefined,
  };
}

function emptyNextWeekTask(): NextWeekTask {
  return { taskName: "", priority: "medium", status: "not_started" };
}

function emptyBlocker(): Blocker {
  return { description: "", isKeyIssue: false };
}

function emptyAchievement(): Achievement {
  return { description: "", isKeyAchievement: false };
}

function emptyHours(): HoursWorked {
  return { category: "", hours: 0 };
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
const TASK_STATUS_OPTIONS = ["not_started", "in_progress", "completed", "blocked"] as const;
const NEXT_TASK_STATUS_OPTIONS = ["not_started", "in_progress", "completed"] as const;
const HOURS_CATEGORIES = ["Development", "Design", "Meetings", "Research", "Documentation", "Testing", "Other"];

type RowError = { index: number; message: string };

type SectionError = { id: string; message: string };

type FormFieldErrors = {
  weekStart?: string;
  weekEnd?: string;
  sections?: SectionError[];
  tasks?: RowError[];
  blockers?: RowError[];
  achievements?: RowError[];
  hoursWorked?: RowError[];
};

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4263A3]">
      {title}
    </h3>
  );
}

function TaskRow({
  task,
  index,
  error,
  onChange,
  onRemove,
}: {
  task: ReportTask;
  index: number;
  error?: string;
  onChange: (index: number, task: ReportTask) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E1E6ED] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <Input
            placeholder="Task name"
            value={task.taskName}
            onChange={(e) => onChange(index, { ...task, taskName: e.target.value })}
            aria-invalid={!!error}
          />
          {error && <p className="text-xs text-[#C85C5C]">{error}</p>}
        </div>
        <Button
          type="button"
          variant="ghostDestructive"
          size="icon"
          className="shrink-0"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Priority</Label>
          <Select value={task.priority} onValueChange={(v) => onChange(index, { ...task, priority: v as ReportTask["priority"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Planned %</Label>
          <Input type="number" min={0} max={100} value={task.plannedPercent}
            onChange={(e) => onChange(index, { ...task, plannedPercent: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Actual %</Label>
          <Input type="number" min={0} max={100} value={task.actualPercent}
            onChange={(e) => onChange(index, { ...task, actualPercent: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={task.status} onValueChange={(v) => onChange(index, { ...task, status: v as ReportTask["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Time planned (hrs)</Label>
          <Input type="number" min={0} step={0.5} value={task.timePlanned ?? ""}
            onChange={(e) => onChange(index, { ...task, timePlanned: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Time spent (hrs)</Label>
          <Input type="number" min={0} step={0.5} value={task.timeSpent ?? ""}
            onChange={(e) => onChange(index, { ...task, timeSpent: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Deliverable</Label>
          <Input placeholder="e.g. PR #123" value={task.deliverable ?? ""}
            onChange={(e) => onChange(index, { ...task, deliverable: e.target.value || undefined })} />
        </div>
      </div>
    </div>
  );
}

export default function ReportFormPage({ editId }: { editId?: string }) {
  const router = useRouter();
  const isEdit = !!editId;

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("none");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [notes, setNotes] = useState("");

  const [tasks, setTasks] = useState<ReportTask[]>([emptyTask()]);
  const [nextWeekTasks, setNextWeekTasks] = useState<NextWeekTask[]>([emptyNextWeekTask()]);
  const [blockers, setBlockers] = useState<Blocker[]>([emptyBlocker()]);
  const [achievements, setAchievements] = useState<Achievement[]>([emptyAchievement()]);
  const [hoursWorked, setHoursWorked] = useState<HoursWorked[]>([
    { category: "Development", hours: 0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [loading, setLoading] = useState(true);

  const projectsFetched = useRef(false);

  useEffect(() => {
    if (projectsFetched.current) return;
    projectsFetched.current = true;
    void getProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects."));
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (editId) {
          const report = await getReport(editId);
          if (!active) return;
          setProjectId(report.projectId ?? "none");
          setWeekStart(report.weekStartDate);
          setWeekEnd(report.weekEndDate);
          setNotes(report.notes ?? "");
          if (report.tasks && report.tasks.length > 0) setTasks(report.tasks);
          if (report.nextWeekTasks && report.nextWeekTasks.length > 0) setNextWeekTasks(report.nextWeekTasks);
          if (report.blockers && report.blockers.length > 0) setBlockers(report.blockers);
          if (report.achievements && report.achievements.length > 0) setAchievements(report.achievements);
          if (report.hoursWorked && report.hoursWorked.length > 0) setHoursWorked(report.hoursWorked);
        } else {
          const week = getCurrentWeekDates();
          if (!active) return;
          setWeekStart(week.start);
          setWeekEnd(week.end);
        }
      } catch {
        if (active) toast.error("Failed to load data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [editId]);

  function updateTask(index: number, task: ReportTask) {
    setTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
    clearFieldErrors("tasks", "sections");
  }

  function updateNextWeekTask(index: number, task: NextWeekTask) {
    setNextWeekTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
    clearFieldErrors("sections");
  }

  function updateBlocker(index: number, blocker: Blocker) {
    setBlockers((prev) => prev.map((b, i) => (i === index ? blocker : b)));
    clearFieldErrors("blockers", "sections");
  }

  function updateAchievement(index: number, achievement: Achievement) {
    setAchievements((prev) => prev.map((a, i) => (i === index ? achievement : a)));
    clearFieldErrors("achievements", "sections");
  }

  function updateHours(index: number, hours: HoursWorked) {
    setHoursWorked((prev) => prev.map((h, i) => (i === index ? hours : h)));
    clearFieldErrors("hoursWorked", "sections");
  }

  function clearFieldErrors(...keys: ("tasks" | "blockers" | "achievements" | "hoursWorked" | "sections")[]) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        if (next[key]) delete next[key];
      }
      return next;
    });
  }

  function validateForm(): FormFieldErrors {
    const next: FormFieldErrors = {};

    if (!weekStart) {
      next.weekStart = "Week start date is required.";
    }
    if (!weekEnd) {
      next.weekEnd = "Week end date is required.";
    }
    if (weekStart && weekEnd && weekEnd < weekStart) {
      next.weekEnd = "Week end date cannot be before the week start date.";
    }

    const taskErrors: RowError[] = [];
    tasks.forEach((task, i) => {
      const isUsed =
        task.taskName.trim() !== "" ||
        task.deliverable ||
        task.timePlanned !== undefined ||
        task.timeSpent !== undefined ||
        task.plannedPercent > 0 ||
        task.actualPercent > 0;
      if (isUsed && !task.taskName.trim()) {
        taskErrors.push({ index: i, message: "Task name is required." });
      }
      if (task.plannedPercent < 0 || task.plannedPercent > 100) {
        taskErrors.push({ index: i, message: "Planned % must be between 0 and 100." });
      }
      if (task.actualPercent < 0 || task.actualPercent > 100) {
        taskErrors.push({ index: i, message: "Actual % must be between 0 and 100." });
      }
      if ((task.timePlanned ?? 0) < 0) {
        taskErrors.push({ index: i, message: "Time planned cannot be negative." });
      }
      if ((task.timeSpent ?? 0) < 0) {
        taskErrors.push({ index: i, message: "Time spent cannot be negative." });
      }
    });
    if (taskErrors.length > 0) {
      next.tasks = taskErrors;
    }

    const blockerErrors: RowError[] = [];
    blockers.forEach((blocker, i) => {
      if (blocker.isKeyIssue && !blocker.description.trim()) {
        blockerErrors.push({ index: i, message: "Please describe the key blocker." });
      }
    });
    if (blockerErrors.length > 0) {
      next.blockers = blockerErrors;
    }

    const achievementErrors: RowError[] = [];
    achievements.forEach((achievement, i) => {
      if (achievement.isKeyAchievement && !achievement.description.trim()) {
        achievementErrors.push({ index: i, message: "Please describe the key achievement." });
      }
    });
    if (achievementErrors.length > 0) {
      next.achievements = achievementErrors;
    }

    const hoursErrors: RowError[] = [];
    hoursWorked.forEach((h, i) => {
      if (h.hours > 0 && !h.category.trim()) {
        hoursErrors.push({ index: i, message: "Select a category for these hours." });
      }
      if (h.hours < 0) {
        hoursErrors.push({ index: i, message: "Hours cannot be negative." });
      }
    });
    if (hoursErrors.length > 0) {
      next.hoursWorked = hoursErrors;
    }

    const sectionErrors: SectionError[] = [];
    if (tasks.every((t) => t.taskName.trim() === "")) {
      sectionErrors.push({ id: "tasks", message: "Add at least one task with a name." });
    }
    if (nextWeekTasks.every((t) => t.taskName.trim() === "")) {
      sectionErrors.push({ id: "next-week", message: "Add at least one task planned for next week." });
    }
    if (blockers.every((b) => b.description.trim() === "")) {
      sectionErrors.push({ id: "blockers", message: "Add at least one blocker or challenge." });
    }
    if (achievements.every((a) => a.description.trim() === "")) {
      sectionErrors.push({ id: "achievements", message: "Add at least one achievement." });
    }
    if (hoursWorked.every((h) => !(h.category.trim() !== "" && h.hours > 0))) {
      sectionErrors.push({ id: "hours", message: "Add hours worked for at least one category." });
    }
    if (sectionErrors.length > 0) {
      next.sections = sectionErrors;
    }

    return next;
  }

  function clearDateError(weekStartCleared: boolean) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (weekStartCleared) delete next.weekStart;
      delete next.weekEnd;
      return next;
    });
  }

  function getSectionError(id: string) {
    return fieldErrors.sections?.find((s) => s.id === id)?.message;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const issues = validateForm();
    if (Object.keys(issues).length > 0) {
      setFieldErrors(issues);
      toast.warning("Please fix the highlighted fields and try again.");
      return;
    }
    setFieldErrors({});
    setSaving(true);

    const payload: CreateReportInput = {
      projectId: projectId === "none" ? undefined : projectId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      notes: notes || undefined,
      tasks: tasks.filter((t) => t.taskName.trim() !== ""),
      nextWeekTasks: nextWeekTasks.filter((t) => t.taskName.trim() !== ""),
      blockers: blockers.filter((b) => b.description.trim() !== ""),
      achievements: achievements.filter((a) => a.description.trim() !== ""),
      hoursWorked: hoursWorked.filter((h) => h.category.trim() !== "" && h.hours > 0),
    };

    try {
      if (isEdit) {
        await updateReport(editId!, payload);
      } else {
        await createReport(payload);
      }
      toast.success(isEdit ? "Report updated." : "Report created.");
      router.push("/reports");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 xl:max-w-6xl 2xl:max-w-[1600px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/reports"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[#4263A3] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to reports
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
            {isEdit ? "Edit weekly report" : "New weekly report"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? "Update your report details below." : "Summarize what you accomplished this week."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div id="details" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <SectionHeader title="Report Details" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Week Start Date</Label>
              <DatePicker
                value={weekStart}
                onChange={(v) => {
                  setWeekStart(v);
                  clearDateError(true);
                }}
                format="MMM d, yyyy"
                placeholder="Select start date"
              />
              {fieldErrors.weekStart && (
                <p className="text-xs text-[#C85C5C]">{fieldErrors.weekStart}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Week End Date</Label>
              <DatePicker
                value={weekEnd}
                onChange={(v) => {
                  setWeekEnd(v);
                  clearDateError(false);
                }}
                format="MMM d, yyyy"
                placeholder="Select end date"
              />
              {fieldErrors.weekEnd && (
                <p className="text-xs text-[#C85C5C]">{fieldErrors.weekEnd}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes / Links</Label>
            <Textarea placeholder="Any additional notes, links, or context..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
          </div>
        </div>

        {/* Tasks Completed */}
        <div id="tasks" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Tasks Completed" />
            <Button type="button" variant="outline" size="sm" onClick={() => setTasks((prev) => [...prev, emptyTask()])}>
              <Plus className="size-4" /> Add task
            </Button>
          </div>
          {getSectionError("tasks") && (
            <p className="text-xs font-medium text-[#C85C5C]">{getSectionError("tasks")}</p>
          )}
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <TaskRow key={i} task={task} index={i} onChange={updateTask}
                error={fieldErrors.tasks?.find((e) => e.index === i)?.message}
                onRemove={(idx) => setTasks((prev) => prev.filter((_, j) => j !== idx))} />
            ))}
          </div>
        </div>

        {/* Next Week Tasks */}
        <div id="next-week" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Planned for Next Week" />
            <Button type="button" variant="outline" size="sm" onClick={() => setNextWeekTasks((prev) => [...prev, emptyNextWeekTask()])}>
              <Plus className="size-4" /> Add task
            </Button>
          </div>
          {getSectionError("next-week") && (
            <p className="text-xs font-medium text-[#C85C5C]">{getSectionError("next-week")}</p>
          )}
          <div className="space-y-3">
            {nextWeekTasks.map((task, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input placeholder="Task name" value={task.taskName} className="flex-1"
                  onChange={(e) => updateNextWeekTask(i, { ...task, taskName: e.target.value })} />
                <Select value={task.priority} onValueChange={(v) => updateNextWeekTask(i, { ...task, priority: v as NextWeekTask["priority"] })}>
                  <SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={task.status} onValueChange={(v) => updateNextWeekTask(i, { ...task, status: v as NextWeekTask["status"] })}>
                  <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NEXT_TASK_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghostDestructive" size="icon" className="shrink-0 self-end sm:self-auto"
                  onClick={() => setNextWeekTasks((prev) => prev.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Blockers */}
        <div id="blockers" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Blockers / Challenges" />
            <Button type="button" variant="outline" size="sm" onClick={() => setBlockers((prev) => [...prev, emptyBlocker()])}>
              <Plus className="size-4" /> Add blocker
            </Button>
          </div>
          {getSectionError("blockers") && (
            <p className="text-xs font-medium text-[#C85C5C]">{getSectionError("blockers")}</p>
          )}
          <div className="space-y-3">
            {blockers.map((blocker, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-1">
                  <Textarea placeholder="Describe the blocker..." value={blocker.description} className="min-h-0"
                    onChange={(e) => updateBlocker(i, { ...blocker, description: e.target.value })} />
                  {fieldErrors.blockers?.find((e) => e.index === i)?.message && (
                    <p className="text-xs text-[#C85C5C]">{fieldErrors.blockers!.find((e) => e.index === i)!.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-start sm:pt-2">
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <Checkbox
                      checked={blocker.isKeyIssue}
                      onCheckedChange={(checked) =>
                        updateBlocker(i, { ...blocker, isKeyIssue: checked })
                      }
                    />
                    Key issue
                  </label>
                  <Button type="button" variant="ghostDestructive" size="icon" className="shrink-0"
                    onClick={() => setBlockers((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div id="achievements" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Achievements / Highlights" />
            <Button type="button" variant="outline" size="sm" onClick={() => setAchievements((prev) => [...prev, emptyAchievement()])}>
              <Plus className="size-4" /> Add achievement
            </Button>
          </div>
          {getSectionError("achievements") && (
            <p className="text-xs font-medium text-[#C85C5C]">{getSectionError("achievements")}</p>
          )}
          <div className="space-y-3">
            {achievements.map((achievement, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-1">
                  <Textarea placeholder="Describe the achievement..." value={achievement.description} className="min-h-0"
                    onChange={(e) => updateAchievement(i, { ...achievement, description: e.target.value })} />
                  {fieldErrors.achievements?.find((e) => e.index === i)?.message && (
                    <p className="text-xs text-[#C85C5C]">{fieldErrors.achievements!.find((e) => e.index === i)!.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-start sm:pt-2">
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <Checkbox
                      checked={achievement.isKeyAchievement}
                      onCheckedChange={(checked) =>
                        updateAchievement(i, { ...achievement, isKeyAchievement: checked })
                      }
                    />
                    Key
                  </label>
                  <Button type="button" variant="ghostDestructive" size="icon" className="shrink-0"
                    onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hours Worked */}
        <div id="hours" className="scroll-mt-24 rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Hours Worked by Category" />
            <Button type="button" variant="outline" size="sm" onClick={() => setHoursWorked((prev) => [...prev, emptyHours()])}>
              <Plus className="size-4" /> Add category
            </Button>
          </div>
          {getSectionError("hours") && (
            <p className="text-xs font-medium text-[#C85C5C]">{getSectionError("hours")}</p>
          )}
          <div className="space-y-3">
            {hoursWorked.map((h, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <Select value={h.category} onValueChange={(v) => updateHours(i, { ...h, category: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {HOURS_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} step={0.5} placeholder="Hours" value={h.hours || ""}
                    onChange={(e) => updateHours(i, { ...h, hours: Number(e.target.value) })} className="w-full sm:w-28" />
                  {fieldErrors.hoursWorked?.find((e) => e.index === i)?.message && (
                    <p className="text-xs text-[#C85C5C]">{fieldErrors.hoursWorked!.find((e) => e.index === i)!.message}</p>
                  )}
                </div>
                <Button type="button" variant="ghostDestructive" size="icon" className="shrink-0 self-end sm:self-auto"
                  onClick={() => setHoursWorked((prev) => prev.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" asChild>
            <Link href="/reports">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="bg-[#4263A3] text-white hover:bg-[#344F85]">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
