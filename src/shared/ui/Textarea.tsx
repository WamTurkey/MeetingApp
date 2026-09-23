import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/shared/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-fg-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={hasError}
          rows={4}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-fg",
            "transition-colors duration-150 resize-y",
            "placeholder:text-surface-400",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            hasError
              ? "border-danger-500 focus:ring-danger-500/30"
              : "border-surface-300 focus:border-brand-500 focus:ring-brand-500/30",
            "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-60",
            className,
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";
