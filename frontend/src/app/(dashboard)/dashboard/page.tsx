import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  FileText,
  FolderKanban,
  PlusCircle,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const stats = [
  { label: "Active projects", value: "24", change: "+4 this week", icon: FolderKanban },
  { label: "Reports submitted", value: "182", change: "+12%", icon: FileText },
  { label: "Team members", value: "46", change: "+3 joined", icon: Users },
  { label: "Avg. review time", value: "2.5h", change: "-30 min", icon: Clock3 },
];

const recentReports = [
  { name: "Alex Morgan", project: "Mobile App Redesign", status: "Pending review", date: "Today, 9:40 AM" },
  { name: "Priya Sharma", project: "Backend Migration", status: "Approved", date: "Today, 8:15 AM" },
  { name: "Daniel Kim", project: "Marketing Landing", status: "In progress", date: "Yesterday" },
  { name: "Sofia Rossi", project: "Data Pipeline", status: "Approved", date: "Yesterday" },
  { name: "Liam O'Brien", project: "Web Dashboard", status: "Needs changes", date: "Sep 1" },
];

const statusColor: Record<string, string> = {
  Approved: "bg-[#3C8C7A]/10 text-[#3C8C7A]",
  "Pending review": "bg-[#D69B3D]/10 text-[#D69B3D]",
  "In progress": "bg-[#4263A3]/10 text-[#4263A3]",
  "Needs changes": "bg-[#C85C5C]/10 text-[#C85C5C]",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18202F] sm:text-3xl">
            Dashboard overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your workspace this week.
          </p>
        </div>
        <Button
          className="bg-[#4263A3] text-white hover:bg-[#344F85]"
          asChild
        >
          <Link href="/reports/create">
            <PlusCircle />
            New report
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#4263A3]/10">
                  <Icon className="size-5 text-[#4263A3]" />
                </div>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#3C8C7A]/10 px-2 py-0.5 text-xs font-semibold text-[#3C8C7A]">
                  <ArrowUpRight className="size-3" />
                  {stat.change}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-[#18202F]">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E1E6ED] bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#E1E6ED] px-5 py-4">
            <h2 className="font-semibold text-[#18202F]">Recent reports</h2>
            <Link
              href="/reports"
              className="text-sm font-semibold text-[#4263A3] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E1E6ED] text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr
                    key={report.name}
                    className="border-b border-[#E1E6ED]/70 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-[#18202F]">
                      {report.name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {report.project}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                          statusColor[report.status]
                        }
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {report.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#18202F]">Weekly completion</h2>
            <div className="mt-4 flex flex-col items-center">
              <div className="relative flex size-32 items-center justify-center">
                <svg className="size-32 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#E1E6ED"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#4263A3"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    strokeDashoffset={264 * (1 - 0.78)}
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-[#18202F]">
                  78%
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                of team reports submitted on time
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-[#18202F]">Quick actions</h2>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/reports/create">
                  <PlusCircle className="text-[#4263A3]" />
                  Write a report
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/projects">
                  <FolderKanban className="text-[#4263A3]" />
                  Manage projects
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
