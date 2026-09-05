"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { addDays, isSameDate, startOfWeek, toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

export type DateFilterMode = "week" | "custom";

type TeamDateFilterProps = {
  startDate: string;
  endDate: string;
  onChange: (from: string, to: string) => void;
};

function parseISODate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}

function formatWeekDisplay(from: string, to: string): string {
  const start = parseISODate(from);
  const end = parseISODate(to);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function TeamDateFilter({
  startDate,
  endDate,
  onChange,
}: TeamDateFilterProps) {
  const [mode, setMode] = useState<DateFilterMode>("week");

  const currentMonday = useMemo(() => startOfWeek(new Date()), []);
  const currentSunday = useMemo(() => addDays(currentMonday, 6), [currentMonday]);

  function shiftWeek(direction: -1 | 1) {
    const start = parseISODate(startDate);
    const next = addDays(start, direction * 7);
    onChange(toISODate(next), toISODate(addDays(next, 6)));
  }

  function applyPreset(preset: "this_week" | "last_week" | "last_14" | "this_month" | "last_30") {
    const now = new Date();
    if (preset === "this_week") {
      onChange(toISODate(currentMonday), toISODate(currentSunday));
    } else if (preset === "last_week") {
      const prevMonday = addDays(currentMonday, -7);
      onChange(toISODate(prevMonday), toISODate(addDays(prevMonday, 6)));
    } else if (preset === "last_14") {
      const start = addDays(now, -13);
      onChange(toISODate(start), toISODate(now));
    } else if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onChange(toISODate(start), toISODate(end));
    } else if (preset === "last_30") {
      const start = addDays(now, -29);
      onChange(toISODate(start), toISODate(now));
    }
  }

  const isCurrentWeek =
    isSameDate(startOfWeek(parseISODate(startDate)), currentMonday) &&
    endDate === toISODate(currentSunday);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      {/* Mode toggle button */}
      <div className="flex items-center gap-1 rounded-lg border border-[#E1E6ED] bg-[#F5F7FA] p-0.5">
        <button
          type="button"
          onClick={() => {
            setMode("week");
            const monday = startOfWeek(parseISODate(startDate));
            onChange(toISODate(monday), toISODate(addDays(monday, 6)));
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
            mode === "week"
              ? "bg-white text-[#18202F] shadow-sm"
              : "text-muted-foreground hover:text-[#18202F]",
          )}
        >
          <CalendarDays className="size-3.5 text-[#4263A3]" />
          Weekly
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
            mode === "custom"
              ? "bg-white text-[#18202F] shadow-sm"
              : "text-muted-foreground hover:text-[#18202F]",
          )}
        >
          <SlidersHorizontal className="size-3.5 text-[#4263A3]" />
          Custom Range
        </button>
      </div>

      {mode === "week" ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-[#E1E6ED] bg-white shadow-sm">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              aria-label="Previous week"
              className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-[#F5F7FA] hover:text-[#18202F]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex h-9 min-w-44 items-center justify-center gap-2 border-x border-[#E1E6ED] px-4 text-xs font-semibold text-[#18202F] sm:text-sm">
              <CalendarRange className="size-4 text-[#4263A3]" />
              {formatWeekDisplay(startDate, endDate)}
            </div>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              aria-label="Next week"
              className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-[#F5F7FA] hover:text-[#18202F]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("this_week")}
            className={cn(isCurrentWeek && "pointer-events-none opacity-50")}
          >
            This week
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <DatePicker
              value={startDate}
              onChange={(val) => {
                if (val) {
                  onChange(val, val > endDate ? val : endDate);
                }
              }}
              placeholder="Start Date"
              format="MMM dd, yyyy"
              className="h-9 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground">to</span>
          <div className="w-36">
            <DatePicker
              value={endDate}
              onChange={(val) => {
                if (val) {
                  onChange(val < startDate ? val : startDate, val);
                }
              }}
              placeholder="End Date"
              format="MMM dd, yyyy"
              className="h-9 text-xs"
            />
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyPreset("this_week")}
              className="rounded-md border border-[#E1E6ED] bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-[#F5F7FA] hover:text-[#18202F]"
            >
              This week
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last_week")}
              className="rounded-md border border-[#E1E6ED] bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-[#F5F7FA] hover:text-[#18202F]"
            >
              Last week
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last_14")}
              className="rounded-md border border-[#E1E6ED] bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-[#F5F7FA] hover:text-[#18202F]"
            >
              14 days
            </button>
            <button
              type="button"
              onClick={() => applyPreset("this_month")}
              className="rounded-md border border-[#E1E6ED] bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-[#F5F7FA] hover:text-[#18202F]"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
