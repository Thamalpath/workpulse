"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  name,
  required,
}: {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center rounded border shadow-sm transition-colors",
        "border-input bg-background",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:outline-none focus-within:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/40",
        checked && "border-primary bg-primary text-primary-foreground",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        className="absolute inset-0 size-full cursor-pointer appearance-none"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        id={id}
        name={name}
        required={required}
      />
      <Check
        className={cn(
          "pointer-events-none absolute size-3 text-current transition-opacity",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}

export { Checkbox };
