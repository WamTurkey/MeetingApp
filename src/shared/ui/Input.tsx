import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, icon, iconRight, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-fg-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border bg-bg-input px-3 text-sm text-fg",
              "transition-colors duration-150",
              "placeholder:text-surface-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              hasError
                ? "border-danger-500 focus:ring-danger-500/30"
                : "border-surface-300 focus:border-brand-500 focus:ring-brand-500/30",
              icon && "pl-10",
              iconRight && "pr-10",
              "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-60",
              className,
            )}
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-fg-muted">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
