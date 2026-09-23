import { type SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { SelectOption } from "@/shared/types/common";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={hasError}
            className={cn(
              "flex h-10 w-full appearance-none rounded-lg border border-border bg-bg-input px-3 pr-10 text-sm text-fg",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              hasError
                ? "border-danger-500 focus:ring-danger-500/30"
                : "border-surface-300 focus:border-brand-500 focus:ring-brand-500/30",
              "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-60",
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        </div>
        {error && (
          <p className="text-xs text-danger-600" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-fg-muted">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
