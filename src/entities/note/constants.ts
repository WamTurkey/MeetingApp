/**
 * Note entity constants.
 *
 * Maps NoteType values to display labels, Lucide icon names,
 * Badge variants, and Tailwind accent colors.
 */
import { NOTE_TYPE, NOTE_TYPE_LABEL, type NoteType } from "@/shared/config/constants";
import type { SelectOption } from "@/shared/types/common";

export { NOTE_TYPE, NOTE_TYPE_LABEL };
export type { NoteType };

/** Badge variant for each note type. */
export const NOTE_TYPE_BADGE_VARIANT: Record<
  NoteType,
  "default" | "primary" | "success" | "warning" | "danger"
> = {
  NOTE: "default",
  DECISION: "primary",
  TASK: "warning",
  INFO: "success",
};

/** Accent color (Tailwind class) for note type indicators. */
export const NOTE_TYPE_ACCENT: Record<NoteType, string> = {
  NOTE: "text-surface-500",
  DECISION: "text-brand-600",
  TASK: "text-warning-600",
  INFO: "text-success-600",
};

/** Background accent for note type left-border or icon container. */
export const NOTE_TYPE_BG: Record<NoteType, string> = {
  NOTE: "bg-surface-100",
  DECISION: "bg-brand-50",
  TASK: "bg-warning-50",
  INFO: "bg-success-50",
};

/** Left-border color for note rows. */
export const NOTE_TYPE_BORDER: Record<NoteType, string> = {
  NOTE: "border-l-surface-300",
  DECISION: "border-l-brand-500",
  TASK: "border-l-warning-500",
  INFO: "border-l-success-500",
};

/** Filter dropdown options for note types. */
export const NOTE_TYPE_OPTIONS: SelectOption<NoteType | "">[] = [
  { value: "", label: "Tüm Tipler" },
  { value: "NOTE", label: "Not" },
  { value: "DECISION", label: "Karar" },
  { value: "TASK", label: "Görev" },
  { value: "INFO", label: "Bilgi" },
];
