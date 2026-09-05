"use client";

import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDays,
  isSameDate,
  startOfWeek,
  toISODate,
} from "@/lib/date";
import { cn } from "@/lib/utils";

type WeekNavProps = {
  weekStart: string;
  weekEnd: string;
  onChange: (from: string, to: string) => void;
};

function parseISODate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}

function formatWeekRange(from: string, to: string): string {
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

export function WeekNav({ weekStart, weekEnd, onChange }: WeekNavProps) {
  const currentRange = startOfWeek(new Date());

  function shiftWeek(direction: -1 | 1) {
    const start = parseISODate(weekStart);
    const next = addDays(start, direction * 7);
    onChange(toISODate(next), toISODate(addDays(next, 6)));
  }

  function goToCurrentWeek() {
    onChange(toISODate(currentRange), toISODate(addDays(currentRange, 6)));
  }

  const isCurrentWeek =
    isSameDate(startOfWeek(parseISODate(weekStart)), currentRange);

  return (
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
        <div className="flex h-9 min-w-44 items-center justify-center gap-2 border-x border-[#E1E6ED] px-4 text-sm font-semibold text-[#18202F]">
          <CalendarRange className="size-4 text-[#4263A3]" />
          {formatWeekRange(weekStart, weekEnd)}
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
        onClick={goToCurrentWeek}
        className={cn(isCurrentWeek && "pointer-events-none opacity-50")}
      >
        This week
      </Button>
    </div>
  );
}