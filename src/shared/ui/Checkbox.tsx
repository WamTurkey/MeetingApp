/**
 * Checkbox — animated toggle with label.
 */
import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  className?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  description,
  className,
}: CheckboxProps) {
  const autoId = useId();

  return (
    <label
      htmlFor={autoId}
      className={cn(
        "group flex cursor-pointer items-start gap-3 select-none",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <div className="relative flex shrink-0 pt-0.5">
        <input
          type="checkbox"
          id={autoId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200",
            checked
              ? "border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500"
              : "border-surface-300 bg-white group-hover:border-surface-400 dark:border-surface-600 dark:bg-surface-900",
          )}
        >
          <Check
            className={cn(
              "h-3.5 w-3.5 text-white transition-all duration-200",
              checked ? "scale-100 opacity-100" : "scale-0 opacity-0",
            )}
            strokeWidth={3}
          />
        </div>
      </div>
      {(label || description) && (
        <div>
          {label && (
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {label}
            </span>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
}
