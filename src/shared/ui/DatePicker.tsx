/**
 * DatePicker — popover calendar using react-day-picker + @floating-ui.
 */
import { useState, useId } from "react";
import { DayPicker } from "react-day-picker";
import { tr } from "react-day-picker/locale";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import { Calendar, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import "react-day-picker/style.css";

export interface DatePickerProps {
  label?: string;
  value?: string; // ISO date "YYYY-MM-DD"
  onChange: (date: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Tarih seçin",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const autoId = useId();

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  function handleSelect(day: Date | undefined) {
    if (day) {
      const iso = day.toLocaleDateString("en-CA"); // YYYY-MM-DD
      onChange(iso);
    }
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  }

  const displayValue = selected
    ? selected.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

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
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        id={autoId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
          "cursor-pointer select-none",
          error
            ? "border-danger-500 focus:ring-danger-500/30"
            : "border-surface-300 hover:border-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-surface-600 dark:hover:border-surface-500",
          disabled && "cursor-not-allowed opacity-50",
          "dark:bg-surface-900 dark:text-surface-100",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-surface-400" />
        <span
          className={cn(
            "flex-1 truncate",
            displayValue
              ? "text-surface-900 dark:text-surface-100"
              : "text-surface-400 dark:text-surface-500",
          )}
        >
          {displayValue || placeholder}
        </span>
        {displayValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger-600 dark:text-danger-400" role="alert">
          {error}
        </p>
      )}
      {open && !disabled && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[100] rounded-xl border border-surface-200 bg-white p-3 shadow-xl dark:border-surface-700 dark:bg-surface-800"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              locale={tr}
              showOutsideDays
              className="rdp-custom"
            />
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
