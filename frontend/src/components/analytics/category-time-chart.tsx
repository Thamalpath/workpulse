"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Clock3 } from "lucide-react";
import type { CategoryTimePoint } from "@/services/analytics.service";

type CategoryTimeChartProps = {
  data: CategoryTimePoint[];
  title?: string;
  subtitle?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Development: "#3B82F6",
  Design: "#8B5CF6",
  Meetings: "#F59E0B",
  Testing: "#10B981",
  Research: "#06B6D4",
  Documentation: "#6366F1",
  Other: "#9CA3AF",
};

const FALLBACK_PALETTE = [
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#EC4899",
  "#6366F1",
  "#9CA3AF",
];

export function CategoryTimeChart({
  data,
  title = "Time Spent by Task Type (Team-Wide)",
  subtitle = "Proportion of total logged effort across categories (e.g. Meetings vs. Development)",
}: CategoryTimeChartProps) {
  const totalHours = data.reduce((sum, d) => sum + d.hours, 0);

  if (!data || data.length === 0 || totalHours === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white p-6 text-center text-xs text-muted-foreground">
        <Clock3 className="size-8 text-gray-300 mb-2" />
        No category hours logged for this timeframe.
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs">
      <div className="border-b border-[#E1E6ED] pb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#18202F] text-sm sm:text-base">
            {title}
          </h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            Effort Share
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="mt-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Donut Chart */}
        <div className="relative h-64 w-full sm:w-1/2 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={3}
                dataKey="hours"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      CATEGORY_COLORS[entry.category] ??
                      FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18202F",
                  borderRadius: "8px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                formatter={(value, name) => {
                  const hours = Number(value ?? 0);
                  return [
                    `${hours}h (${Math.round((hours / totalHours) * 100)}%)`,
                    name,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Callout */}
          <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-[#18202F]">
              {Math.round(totalHours)}h
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Total Logged
            </span>
          </div>
        </div>

        {/* Legend & Breakdown list */}
        <div className="w-full sm:w-1/2 space-y-2 max-h-60 overflow-y-auto pr-1">
          {data.map((item, index) => {
            const color =
              CATEGORY_COLORS[item.category] ??
              FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
            return (
              <div
                key={item.category}
                className="flex items-center justify-between rounded-lg border border-[#E1E6ED]/80 bg-[#F8FAFC] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-[#18202F]">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#18202F]">{item.hours}h</span>
                  <span className="rounded-full bg-white border border-[#E1E6ED] px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
