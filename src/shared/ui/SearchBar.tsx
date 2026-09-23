/**
 * SearchBar — global, reusable search input component.
 *
 * Consistent styling across all pages. Uses the design from
 * MeetingFilterBar (glassmorphic, icon left, clear button).
 * Supports debounce via parent or integrated.
 */
import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  /** Compact variant for tight spaces. */
  size?: "sm" | "md";
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, onClear, placeholder = "Ara...", size = "md", className, ...props }, ref) => {
    const inputId = useId();

    return (
      <div className={cn("relative", className)}>
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
        />
        <input
          ref={ref}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-surface-300 bg-white text-surface-900 outline-none transition-all duration-150",
            "placeholder-surface-400",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-0",
            "dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm" ? "h-9 pl-9 pr-8 text-xs" : "h-10 pl-10 pr-9 text-sm",
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded p-0.5 text-surface-400 hover:text-surface-600 transition-colors",
              "dark:text-surface-500 dark:hover:text-surface-300",
              size === "sm" ? "right-2" : "right-2.5",
            )}
            aria-label="Temizle"
          >
            <X className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
