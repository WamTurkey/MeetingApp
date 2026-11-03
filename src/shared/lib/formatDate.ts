import { LOCALE, TIMEZONE } from "@/shared/config/constants";

/** Returns `YYYY-MM-DD` for a date in `Europe/Istanbul`. */
export function toIstanbulDateKey(date: string | Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface IstanbulWeekDay {
  key: string;
  weekday: string;
  day: number;
  isToday: boolean;
}

/** Monday–Sunday strip for the week that contains `anchorKey` (YYYY-MM-DD). */
export function getIstanbulWeekDays(anchorKey?: string): IstanbulWeekDay[] {
  const todayKey = toIstanbulDateKey();
  const key = anchorKey && /^\d{4}-\d{2}-\d{2}$/.test(anchorKey) ? anchorKey : todayKey;
  const noon = new Date(`${key}T12:00:00+03:00`);
  const short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TIMEZONE }).format(noon);
  const offsetFromMonday = ((WEEKDAY_INDEX[short] ?? 1) + 6) % 7;
  const monday = new Date(noon.getTime() - offsetFromMonday * 86_400_000);
  const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: TIMEZONE });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: TIMEZONE });

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86_400_000);
    const dayKey = toIstanbulDateKey(d);
    return {
      key: dayKey,
      weekday: weekdayFmt.format(d).replace(".", ""),
      day: Number(dayFmt.format(d)),
      isToday: dayKey === todayKey,
    };
  });
}

/** First-to-last day strip for `yearMonth` (`YYYY-MM` or `YYYY-MM-DD`) in Istanbul. */
export function getIstanbulMonthDays(yearMonth?: string): IstanbulWeekDay[] {
  const todayKey = toIstanbulDateKey();
  const source = yearMonth && /^\d{4}-\d{2}/.test(yearMonth) ? yearMonth.slice(0, 7) : todayKey.slice(0, 7);
  const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: TIMEZONE });
  const days: IstanbulWeekDay[] = [];

  for (let day = 1; day <= 31; day++) {
    const key = `${source}-${String(day).padStart(2, "0")}`;
    const noon = new Date(`${key}T12:00:00+03:00`);
    if (Number.isNaN(noon.getTime())) break;
    const actual = toIstanbulDateKey(noon);
    if (!actual.startsWith(source)) break;
    days.push({
      key: actual,
      weekday: weekdayFmt.format(noon).replace(".", ""),
      day,
      isToday: actual === todayKey,
    });
  }

  return days;
}

export function formatIstanbulMonthLabel(yearMonth: string): string {
  const key = `${yearMonth.slice(0, 7)}-01`;
  const noon = new Date(`${key}T12:00:00+03:00`);
  if (Number.isNaN(noon.getTime())) return yearMonth;
  return new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: TIMEZONE }).format(noon);
}

export function getIstanbulMonthNames(): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(LOCALE, { month: "long", timeZone: TIMEZONE }).format(
      new Date(`2026-${String(index + 1).padStart(2, "0")}-01T12:00:00+03:00`),
    ),
  );
}

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
