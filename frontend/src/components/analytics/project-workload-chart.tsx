"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FolderKanban } from "lucide-react";
import type { ProjectWorkloadPoint } from "@/services/analytics.service";
import { cn } from "@/lib/utils";

type ProjectWorkloadChartProps = {
  data: ProjectWorkloadPoint[];
  title?: string;
  subtitle?: string;
};

const PROJECT_PALETTE = [
  "#4263A3",
  "#3C8C7A",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#6366F1",
];

export function ProjectWorkloadChart({
  data,
  title = "Workload & Task Distribution by Project",
  subtitle = "Allocation of deliverables and logged hours across initiatives",
}: ProjectWorkloadChartProps) {
  const [viewMetric, setViewMetric] = useState<"tasks" | "hours">("tasks");

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white p-6 text-center text-xs text-muted-foreground">
        <FolderKanban className="size-8 text-gray-300 mb-2" />
        No project workload data recorded.
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E1E6ED] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#18202F] text-sm sm:text-base">
              {title}
            </h3>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              Workload
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#E1E6ED] bg-[#F5F7FA] p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMetric("tasks")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              viewMetric === "tasks"
                ? "bg-white text-[#18202F] shadow-xs"
                : "text-muted-foreground hover:text-[#18202F]",
            )}
          >
            Tasks
          </button>
          <button
            type="button"
            onClick={() => setViewMetric("hours")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              viewMetric === "hours"
                ? "bg-white text-[#18202F] shadow-xs"
                : "text-muted-foreground hover:text-[#18202F]",
            )}
          >
            Hours Logged
          </button>
        </div>
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 25, left: 35, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6B7280", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="projectName"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fill: "#374151", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18202F",
                borderRadius: "8px",
                border: "none",
                color: "#fff",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
formatter={(value) => [
                  `${Number(value ?? 0)} ${viewMetric === "tasks" ? "tasks" : "hours"}`,
                  viewMetric === "tasks" ? "Task Count" : "Hours Logged",
                ] as [string, string]}
            />
            <Bar
              dataKey={viewMetric === "tasks" ? "taskCount" : "totalHours"}
              radius={[0, 6, 6, 0]}
              barSize={20}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PROJECT_PALETTE[index % PROJECT_PALETTE.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
