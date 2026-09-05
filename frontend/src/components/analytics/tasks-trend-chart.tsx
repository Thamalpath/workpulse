"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Clock, ListChecks, TrendingUp } from "lucide-react";
import type { TasksTrendPoint } from "@/services/analytics.service";
import { cn } from "@/lib/utils";

type TasksTrendChartProps = {
  data: TasksTrendPoint[];
  title?: string;
  subtitle?: string;
};

export function TasksTrendChart({
  data,
  title = "Tasks Completed Trend Over Time",
  subtitle = "Weekly trajectory of planned, completed, and in-progress tasks across the team",
}: TasksTrendChartProps) {
  const [metricMode, setMetricMode] = useState<"tasks" | "hours">("tasks");

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white p-6 text-center text-xs text-muted-foreground">
        <ListChecks className="size-8 text-gray-300 mb-2" />
        No task trend data available for this timeframe.
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
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#4263A3]">
              Trend
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {/* Toggle between Tasks count and Hours */}
        <div className="flex items-center gap-1 rounded-lg border border-[#E1E6ED] bg-[#F5F7FA] p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode("tasks")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              metricMode === "tasks"
                ? "bg-white text-[#18202F] shadow-xs"
                : "text-muted-foreground hover:text-[#18202F]",
            )}
          >
            <CheckCircle2 className="size-3 text-emerald-600" />
            Task Counts
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("hours")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              metricMode === "hours"
                ? "bg-white text-[#18202F] shadow-xs"
                : "text-muted-foreground hover:text-[#18202F]",
            )}
          >
            <Clock className="size-3 text-[#4263A3]" />
            Hours Logged
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === "tasks" ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4263A3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4263A3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
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
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Area
                type="monotone"
                dataKey="completedTasks"
                name="Completed"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCompleted)"
              />
              <Area
                type="monotone"
                dataKey="inProgressTasks"
                name="In Progress"
                stroke="#4263A3"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInProgress)"
              />
              <Area
                type="monotone"
                dataKey="blockedTasks"
                name="Blocked"
                stroke="#EF4444"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorBlocked)"
              />
            </AreaChart>
          ) : (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4263A3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4263A3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
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
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Area
                type="monotone"
                dataKey="totalHoursSpent"
                name="Hours Spent"
                stroke="#4263A3"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSpent)"
              />
              <Area
                type="monotone"
                dataKey="totalHoursPlanned"
                name="Hours Planned"
                stroke="#9CA3AF"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorPlanned)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
