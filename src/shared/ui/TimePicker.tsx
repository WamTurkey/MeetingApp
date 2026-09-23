/**
 * TimePicker — styled time input with clock icon.
 */
import { useId } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface TimePickerProps {
  label?: string;
  value?: string | null; // "HH:MM"
  onChange: (time: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  label,
  value,
  onChange,
  error,
  disabled = false,
  className,
}: TimePickerProps) {
  const autoId = useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={autoId}
          className="text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <input
          type="time"
          id={autoId}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-surface-900",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-danger-500 focus:ring-danger-500/30"
              : "border-surface-300 focus:border-brand-500 focus:ring-brand-500/30 dark:border-surface-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-surface-900 dark:text-surface-100",
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-danger-600 dark:text-danger-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
