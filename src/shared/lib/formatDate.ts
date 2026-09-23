import { LOCALE, TIMEZONE } from "@/shared/config/constants";

/**
 * Format an ISO date string or Date to Turkish locale display.
 *
 * @example
 * formatDate("2026-09-22")            // "22 Eylül 2026"
 * formatDate("2026-09-22", "short")   // "22.09.2026"
 * formatDate("2026-09-22", "weekday") // "Pazartesi, 22 Eylül 2026"
 */
export function formatDate(
  date: string | Date | null | undefined,
  variant: "long" | "short" | "weekday" = "long",
): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "—";

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    long: { day: "numeric", month: "long", year: "numeric", timeZone: TIMEZONE },
    short: { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIMEZONE },
    weekday: {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIMEZONE,
    },
  };

  return new Intl.DateTimeFormat(LOCALE, options[variant]).format(d);
}

/**
 * Format an ISO datetime string to Turkish locale time.
 *
 * @example
 * formatTime("2026-09-22T14:30:00Z") // "14:30"
 * formatTime("2026-09-22T14:30:00Z", true) // "14:30:45"
 */
export function formatTime(
  date: string | Date | null | undefined,
  showSeconds = false,
): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds && { second: "2-digit" }),
    timeZone: TIMEZONE,
    hour12: false,
  }).format(d);
}

/**
 * Format a full date + time string.
 *
 * @example
 * formatDateTime("2026-09-22T14:30:00Z") // "22 Eylül 2026, 14:30"
 */
export function formatDateTime(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
    hour12: false,
  }).format(d);
}

/**
 * Relative time (e.g., "2 saat önce", "3 gün önce").
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "—";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

  if (diffDay > 0) return rtf.format(-diffDay, "day");
  if (diffHr > 0) return rtf.format(-diffHr, "hour");
  if (diffMin > 0) return rtf.format(-diffMin, "minute");
  return rtf.format(-diffSec, "second");
}
