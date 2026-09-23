/**
 * MeetingDateLabel — formatted date display with calendar icon.
 *
 * Renders a meeting date formatted in Turkish locale (e.g., "22 Eylül 2026")
 * with a Lucide calendar icon. Pure presentational — no side effects.
 *
 * @example
 * <MeetingDateLabel date="2026-09-22" />
 * <MeetingDateLabel date="2026-09-22" variant="weekday" />
 */
import { Calendar } from "lucide-react";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/cn";

export interface MeetingDateLabelProps {
  date: string | null | undefined;
  variant?: "long" | "short" | "weekday";
  className?: string;
}

export function MeetingDateLabel({
  date,
  variant = "long",
  className,
}: MeetingDateLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-surface-500",
        className,
      )}
    >
      <Calendar className="h-3.5 w-3.5 shrink-0" />
      <span>{formatDate(date, variant)}</span>
    </span>
  );
}
