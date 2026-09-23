import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/* ── Card Root ───────────────────────────────────── */

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hoverable = false, onClick }: CardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "rounded-xl border border-surface-200 bg-bg-card shadow-card",
        hoverable && "cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Card.Header ─────────────────────────────────── */

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border-muted px-5 py-4", className)}>
      {children}
    </div>
  );
}

/* ── Card.Content ────────────────────────────────── */

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}

/* ── Card.Footer ─────────────────────────────────── */

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-border-muted px-5 py-3", className)}>
      {children}
    </div>
  );
}

/* ── Compound Export ─────────────────────────────── */

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
