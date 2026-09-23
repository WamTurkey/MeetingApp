import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const variants = {
  default: "bg-bg-muted text-fg-secondary",
  primary: "bg-brand-100 text-brand-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  danger: "bg-danger-100 text-danger-700",
} as const;

const sizes = {
  sm: "px-1.5 py-0.5 text-2xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
} as const;

export interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Optional dot indicator before the text. */
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-surface-500": variant === "default",
            "bg-brand-500": variant === "primary",
            "bg-success-500": variant === "success",
            "bg-warning-500": variant === "warning",
            "bg-danger-500": variant === "danger",
          })}
        />
      )}
      {children}
    </span>
  );
}
