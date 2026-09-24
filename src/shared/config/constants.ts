/** Application-wide constants. Zero business logic. */

export const APP_NAME = "Toplantı Yönetimi" as const;
export const APP_VERSION = "1.0.0" as const;

/** Default API base URL (proxied by Vite in dev). */
export const API_BASE_URL = "/api" as const;

/** ── Pagination Defaults ────────────────────────── */
export const DEFAULT_PAGE = 1 as const;
export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

/** ── Meeting Status ─────────────────────────────── */
export const MEETING_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  EXPORTED: "EXPORTED",
} as const;

export type MeetingStatus = (typeof MEETING_STATUS)[keyof typeof MEETING_STATUS];

/** Status display labels (Turkish). */
export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  EXPORTED: "Dışa Aktarıldı",
};

/** Status → Tailwind color class mapping. */
export const MEETING_STATUS_COLOR: Record<MeetingStatus, string> = {
  DRAFT: "bg-bg-muted text-fg-secondary",
  ACTIVE: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-success-100 text-success-700",
  EXPORTED: "bg-warning-100 text-warning-700",
};

/** ── Note Types ─────────────────────────────────── */
export const NOTE_TYPE = {
  NOTE: "NOTE",
  DECISION: "DECISION",
  TASK: "TASK",
  INFO: "INFO",
} as const;

export type NoteType = (typeof NOTE_TYPE)[keyof typeof NOTE_TYPE];

export const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  NOTE: "Not",
  DECISION: "Karar",
  TASK: "Görev",
  INFO: "Bilgi",
};

/** ── Date/Time Locale ───────────────────────────── */
export const LOCALE = "tr-TR" as const;
export const TIMEZONE = "Europe/Istanbul" as const;

/** ── Action/Task Status ─────────────────────────── */
export const ACTION_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
  ROLLED_OVER: "ROLLED_OVER",
} as const;

export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "Sürüyor",
  DONE: "Tamamlandı",
  CANCELLED: "İptal",
  ROLLED_OVER: "Devredildi",
};

export const ACTION_STATUS_COLOR: Record<ActionStatus, string> = {
  OPEN: "bg-brand-50 text-brand-700",
  IN_PROGRESS: "bg-warning-50 text-warning-700",
  DONE: "bg-success-50 text-success-700",
  CANCELLED: "bg-surface-100 text-surface-500",
  ROLLED_OVER: "bg-purple-50 text-purple-700",
};

/** ── Attendance Status ──────────────────────────── */
export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  INVITED: "INVITED",
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Katıldı",
  ABSENT: "Katılmadı",
  INVITED: "Davetli",
};

/** ── Meeting Link Types ─────────────────────────── */
export const RELATION_TYPE = {
  CONTINUATION: "CONTINUATION",
  FOLLOW_UP: "FOLLOW_UP",
} as const;

export type RelationType = (typeof RELATION_TYPE)[keyof typeof RELATION_TYPE];

export const RELATION_LABEL: Record<RelationType, string> = {
  CONTINUATION: "Devam Toplantısı",
  FOLLOW_UP: "Takip Toplantısı",
};

/** ── Followup Buckets ───────────────────────────── */
export const FOLLOWUP_BUCKET = {
  OVERDUE: "OVERDUE",
  TODAY: "TODAY",
  SOON: "SOON",
  LATER: "LATER",
  NO_DATE: "NO_DATE",
  CLOSED: "CLOSED",
} as const;

export type FollowupBucket = (typeof FOLLOWUP_BUCKET)[keyof typeof FOLLOWUP_BUCKET];

export const FOLLOWUP_BUCKET_LABEL: Record<FollowupBucket, string> = {
  OVERDUE: "Geciken",
  TODAY: "Bugün",
  SOON: "Önümüzdeki 7 Gün",
  LATER: "Daha Sonra",
  NO_DATE: "Terminsiz",
  CLOSED: "Tamamlanan",
};

export const FOLLOWUP_BUCKET_COLOR: Record<FollowupBucket, string> = {
  OVERDUE: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-950/30 dark:text-danger-300 dark:border-danger-800",
  TODAY: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-950/30 dark:text-warning-300 dark:border-warning-800",
  SOON: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-800",
  LATER: "bg-bg-muted text-fg-secondary border-border",
  NO_DATE: "bg-bg-muted text-fg-muted border-border",
  CLOSED: "bg-success-50 text-success-700 border-success-200 dark:bg-success-950/30 dark:text-success-300 dark:border-success-800",
};
