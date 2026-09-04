"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      classNames={{
        months: "flex w-fit flex-col md:flex-row gap-6",
        month: "relative flex w-full flex-col gap-4",
        nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
        button_previous:
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40",
        button_next:
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40",
        month_caption:
          "flex h-9 w-full items-center justify-center px-9 text-sm font-semibold text-foreground",
        caption_label: "text-sm font-semibold",
        month_grid: "w-full",
        weekdays: "flex items-center justify-between",
        weekday:
          "flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground",
        week: "mt-1 flex items-center justify-between",
        day: "flex h-9 w-9 items-center justify-center p-0 text-center text-sm",
        today: "",
        outside: "",
        disabled: "",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      formatters={formatters}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      aria-selected={modifiers.selected}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-normal text-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        modifiers.today && "border border-primary",
        modifiers.selected &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        modifiers.outside &&
          !modifiers.selected &&
          "text-muted-foreground opacity-40",
        modifiers.disabled && "pointer-events-none opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };