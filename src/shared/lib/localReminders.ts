import { TIMEZONE } from "@/shared/config/constants";

const STORAGE_KEY = "meeting-app:fired-local-reminders";
const MAX_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;
const pendingTimers = new Map<string, number>();

export interface LocalReminderInput {
  key: string;
  title: string;
  body: string;
  fireAt: Date;
}

function readFiredKeys(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

function markFired(key: string): void {
  const keys = readFiredKeys();
  if (keys.includes(key)) return;
  keys.push(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

function hasFired(key: string): boolean {
  return readFiredKeys().includes(key);
}

export async function ensureNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

/** Builds a wall-clock instant in Europe/Istanbul (UTC+3). */
export function istanbulWallTime(dateYmd: string, timeHHmm = "09:00"): Date {
  const datePart = dateYmd.slice(0, 10);
  const timePart = timeHHmm.length >= 5 ? timeHHmm.slice(0, 5) : "09:00";
  return new Date(`${datePart}T${timePart}:00+03:00`);
}

export function istanbulTodayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function scheduleLocalReminder(input: LocalReminderInput): boolean {
  if (hasFired(input.key) || pendingTimers.has(input.key)) return false;
  const delay = input.fireAt.getTime() - Date.now();
  if (delay <= 0 || delay > MAX_AHEAD_MS) return false;

  const timerId = window.setTimeout(() => {
    pendingTimers.delete(input.key);
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    markFired(input.key);
    try {
      new Notification(input.title, { body: input.body });
    } catch {
      /* Notification may fail if the document is not visible on some browsers */
    }
  }, delay);

  pendingTimers.set(input.key, timerId);
  return true;
}
