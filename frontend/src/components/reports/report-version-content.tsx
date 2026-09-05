import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportVersionDetail } from "@/services/report.service";

export function ReportVersionContent({ version }: { version: ReportVersionDetail }) {
  const totalHours = version.hoursWorked.reduce((sum, h) => sum + h.hours, 0);

  return (
    <div className="space-y-4">
      {version.notes && (
        <div className="rounded-lg bg-[#F5F7FA] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4263A3] mb-1">
            Notes
          </p>
          <p className="whitespace-pre-wrap text-sm text-[#18202F]">{version.notes}</p>
        </div>
      )}

      {version.tasks.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4263A3] mb-2">
            Tasks Completed
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Deliverable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {version.tasks.map((task, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-[#18202F]">{task.taskName}</TableCell>
                  <TableCell>
                    <Badge variant={task.priority === "critical" || task.priority === "high" ? "destructive" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.status.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>{task.plannedPercent}%</TableCell>
                  <TableCell>{task.actualPercent}%</TableCell>
                  <TableCell className="text-muted-foreground">{task.deliverable ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {version.nextWeekTasks.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4263A3] mb-2">
            Planned for Next Week
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {version.nextWeekTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-[#F5F7FA] px-4 py-2.5">
                <Badge variant={task.priority === "critical" || task.priority === "high" ? "destructive" : "secondary"} className="shrink-0">
                  {task.priority}
                </Badge>
                <span className="flex-1 text-sm text-[#18202F]">{task.taskName}</span>
                <span className="text-xs text-muted-foreground">
                  {task.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {version.blockers.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4263A3] mb-2">
            Blockers / Challenges
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {version.blockers.map((blocker, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-orange-200 bg-[#FFF7ED] px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm text-[#18202F]">{blocker.description}</p>
                </div>
                {blocker.isKeyIssue && <Badge variant="destructive" className="shrink-0">Key Issue</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {version.achievements.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4263A3] mb-2">
            Achievements / Highlights
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {version.achievements.map((achievement, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm text-[#18202F]">{achievement.description}</p>
                </div>
                {achievement.isKeyAchievement && (
                  <Badge className="shrink-0 bg-green-600 text-white hover:bg-green-700">Key</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {version.hoursWorked.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4263A3] mb-2">
            Hours Worked
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {version.hoursWorked.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-[#18202F]">{h.category}</TableCell>
                  <TableCell className="text-right">{h.hours}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totalHours}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {version.tasks.length === 0 &&
        version.nextWeekTasks.length === 0 &&
        version.blockers.length === 0 &&
        version.achievements.length === 0 &&
        version.hoursWorked.length === 0 &&
        !version.notes && (
          <p className="text-sm text-muted-foreground">This version is empty.</p>
        )}
    </div>
  );
}