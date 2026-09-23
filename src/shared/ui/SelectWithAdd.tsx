/**
 * SelectWithAdd — Select dropdown with an inline "+ Ekle" button.
 *
 * Renders the global <Select> with a small add button on the right.
 * The `onAdd` callback opens a nested modal (parent manages).
 * Fully react-hook-form compatible via forwardRef.
 */
import { type SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { SelectOption } from "@/shared/types/common";

export interface SelectWithAddProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  onAdd?: () => void;
  addLabel?: string;
}

export const SelectWithAdd = forwardRef<HTMLSelectElement, SelectWithAddProps>(
  ({ className, label, error, helperText, options, placeholder, onAdd, addLabel = "Ekle", id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-fg-secondary">
            {label}
          </label>
        )}
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <select
              ref={ref}
              id={selectId}
              aria-invalid={hasError}
              className={cn(
                "flex h-10 w-full appearance-none rounded-lg border border-border bg-bg-input px-3 pr-10 text-sm text-fg",
                "transition-colors duration-150 dark:bg-surface-800 dark:text-surface-100",
                "focus:outline-none focus:ring-2 focus:ring-offset-0",
                hasError
                  ? "border-danger-500 focus:ring-danger-500/30"
                  : "border-surface-300 focus:border-brand-500 focus:ring-brand-500/30 dark:border-surface-600",
                "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-60",
                className,
              )}
              {...props}
            >
              {placeholder && (
                <option value="">{placeholder}</option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          </div>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              title={addLabel}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed transition-all duration-150",
                "border-brand-400 text-brand-600 hover:bg-brand-50 hover:border-brand-500 active:scale-95",
                "dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-950/30",
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-danger-600" role="alert">{error}</p>}
        {helperText && !error && <p className="text-xs text-surface-500">{helperText}</p>}
      </div>
    );
  },
);

SelectWithAdd.displayName = "SelectWithAdd";
