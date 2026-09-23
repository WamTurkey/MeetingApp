/**
 * Meeting entity constants.
 *
 * Re-exports shared status values and adds entity-specific
 * display mappings (icons, transition labels, etc.).
 */
import {
  MEETING_STATUS,
  MEETING_STATUS_COLOR,
  MEETING_STATUS_LABEL,
  type MeetingStatus,
} from "@/shared/config/constants";
import type { SelectOption } from "@/shared/types/common";

export { MEETING_STATUS, MEETING_STATUS_COLOR, MEETING_STATUS_LABEL };
export type { MeetingStatus };

/** Valid status transitions for the meeting state machine. */
export const MEETING_TRANSITIONS: Record<MeetingStatus, MeetingStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: ["EXPORTED"],
  EXPORTED: [],
};

/** Whether a meeting in this status can be edited. */
export const IS_EDITABLE: Record<MeetingStatus, boolean> = {
  DRAFT: true,
  ACTIVE: true,
  COMPLETED: false,
  EXPORTED: false,
};

/** Whether a meeting in this status can be deleted. */
export const IS_DELETABLE: Record<MeetingStatus, boolean> = {
  DRAFT: true,
  ACTIVE: false,
  COMPLETED: false,
  EXPORTED: false,
};

/** Status options for filter dropdowns. */
export const MEETING_STATUS_OPTIONS: SelectOption<MeetingStatus | "">[] = [
  { value: "", label: "Tüm Durumlar" },
  { value: "DRAFT", label: "Taslak" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "EXPORTED", label: "Dışa Aktarıldı" },
];

/**
 * Badge variant mapping for MeetingStatusBadge.
 * Maps each status to a shared Badge `variant` prop.
 */
export const STATUS_BADGE_VARIANT: Record<
  MeetingStatus,
  "default" | "primary" | "success" | "warning" | "danger"
> = {
  DRAFT: "default",
  ACTIVE: "primary",
  COMPLETED: "success",
  EXPORTED: "warning",
};
