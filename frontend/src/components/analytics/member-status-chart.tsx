"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";
import type { MemberStatusPoint } from "@/services/analytics.service";

type MemberStatusChartProps = {
  data: MemberStatusPoint[];
  title?: string;
  subtitle?: string;
};

export function MemberStatusChart({
  data,
  title = "Report Submission & Approval Status by Member",
  subtitle = "Breakdown of submission states across each active team member",
}: MemberStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-[#E1E6ED] bg-white p-6 text-center text-xs text-muted-foreground">
        <Users className="size-8 text-gray-300 mb-2" />
        No team member data available.
      </div>
    );
  }

  // Format short names for X-Axis to prevent clutter
  const chartData = data.map((d) => {
    const parts = d.userName.split(" ");
    const shortName =
      parts.length > 1
        ? `${parts[0]} ${parts[1][0]}.`
        : parts[0];
    return {
      ...d,
      shortName,
    };
  });

  return (
    <div className="flex flex-col rounded-xl border border-[#E1E6ED] bg-white p-5 shadow-xs">
      <div className="border-b border-[#E1E6ED] pb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#18202F] text-sm sm:text-base">
            {title}
          </h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Roster Status
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              tick={{ fill: "#6B7280", fontSize: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
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
              formatter={(value: number, name: string) => [`${value} report(s)`, name]}
              labelFormatter={(label) => `Member: ${label}`}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />
            <Bar
              dataKey="approved"
              name="Approved"
              stackId="a"
              fill="#10B981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="submitted"
              name="Submitted"
              stackId="a"
              fill="#3B82F6"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="needsCorrection"
              name="Needs Correction"
              stackId="a"
              fill="#F59E0B"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="draft"
              name="Draft"
              stackId="a"
              fill="#A855F7"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="notStarted"
              name="Not Started"
              stackId="a"
              fill="#E5E7EB"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
