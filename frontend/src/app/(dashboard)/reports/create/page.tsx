"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  getProjects,
  getReport,
  createReport,
  updateReport,
  type Project,
  type CreateReportInput,
  type ReportTask,
  type NextWeekTask,
  type Blocker,
  type Achievement,
  type HoursWorked,
} from "@/services/report.service";

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
  onChange,
  onRemove,
}: {
  task: ReportTask;
  index: number;
  onChange: (index: number, task: ReportTask) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E1E6ED] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Input
          placeholder="Task name"
          value={task.taskName}
          onChange={(e) => onChange(index, { ...task, taskName: e.target.value })}
          className="flex-1"
        />
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const projData = await getProjects();
        if (!active) return;
        setProjects(projData);

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
          setWeekStart(week.start);
          setWeekEnd(week.end);
        }
      } catch {
        setError("Failed to load data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [editId]);

  function updateTask(index: number, task: ReportTask) {
    setTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
  }

  function updateNextWeekTask(index: number, task: NextWeekTask) {
    setNextWeekTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
  }

  function updateBlocker(index: number, blocker: Blocker) {
    setBlockers((prev) => prev.map((b, i) => (i === index ? blocker : b)));
  }

  function updateAchievement(index: number, achievement: Achievement) {
    setAchievements((prev) => prev.map((a, i) => (i === index ? achievement : a)));
  }

  function updateHours(index: number, hours: HoursWorked) {
    setHoursWorked((prev) => prev.map((h, i) => (i === index ? hours : h)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
      router.push("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        {error && <p className="text-sm text-[#C85C5C]">{error}</p>}

        {/* Basic Info */}
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <SectionHeader title="Report Details" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Week Start Date</Label>
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Week End Date</Label>
              <Input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} required />
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Tasks Completed" />
            <Button type="button" variant="outline" size="sm" onClick={() => setTasks((prev) => [...prev, emptyTask()])}>
              <Plus className="size-4" /> Add task
            </Button>
          </div>
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <TaskRow key={i} task={task} index={i} onChange={updateTask}
                onRemove={(idx) => setTasks((prev) => prev.filter((_, j) => j !== idx))} />
            ))}
          </div>
        </div>

        {/* Next Week Tasks */}
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Planned for Next Week" />
            <Button type="button" variant="outline" size="sm" onClick={() => setNextWeekTasks((prev) => [...prev, emptyNextWeekTask()])}>
              <Plus className="size-4" /> Add task
            </Button>
          </div>
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Blockers / Challenges" />
            <Button type="button" variant="outline" size="sm" onClick={() => setBlockers((prev) => [...prev, emptyBlocker()])}>
              <Plus className="size-4" /> Add blocker
            </Button>
          </div>
          <div className="space-y-3">
            {blockers.map((blocker, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <Textarea placeholder="Describe the blocker..." value={blocker.description} className="flex-1 min-h-0"
                  onChange={(e) => updateBlocker(i, { ...blocker, description: e.target.value })} />
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Achievements / Highlights" />
            <Button type="button" variant="outline" size="sm" onClick={() => setAchievements((prev) => [...prev, emptyAchievement()])}>
              <Plus className="size-4" /> Add achievement
            </Button>
          </div>
          <div className="space-y-3">
            {achievements.map((achievement, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <Textarea placeholder="Describe the achievement..." value={achievement.description} className="flex-1 min-h-0"
                  onChange={(e) => updateAchievement(i, { ...achievement, description: e.target.value })} />
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
        <div className="rounded-xl border border-[#E1E6ED] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionHeader title="Hours Worked by Category" />
            <Button type="button" variant="outline" size="sm" onClick={() => setHoursWorked((prev) => [...prev, emptyHours()])}>
              <Plus className="size-4" /> Add category
            </Button>
          </div>
          <div className="space-y-3">
            {hoursWorked.map((h, i) => (
              <div key={i} className="rounded-lg border border-[#E1E6ED] p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={h.category} onValueChange={(v) => updateHours(i, { ...h, category: v })}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {HOURS_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={0} step={0.5} placeholder="Hours" value={h.hours || ""}
                  onChange={(e) => updateHours(i, { ...h, hours: Number(e.target.value) })} className="w-full sm:w-28" />
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
