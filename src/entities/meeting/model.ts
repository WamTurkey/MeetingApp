/**
 * Meeting domain model.
 *
 * Represents a single meeting entity as returned from the backend API.
 * Immutable — UI components receive this via props and render it read-only.
 */
import type { BaseEntity } from "@/shared/types/common";
import type { MeetingStatus } from "@/shared/config/constants";

export interface Meeting extends BaseEntity {
  /** Meeting title / subject line. */
  title: string;
  /** Optional extended description or agenda. */
  description: string;
  /** Detailed agenda / subject text. */
  subject?: string;
  /** Scheduled date in ISO format (YYYY-MM-DD). */
  meeting_date: string;
  /** Planned start time (HH:mm). */
  planned_start?: string | null;
  /** Current lifecycle status. */
  status: MeetingStatus;
  /** Optimistic concurrency version counter. */
  version: number;
  /** Foreign key — associated project. */
  project_id?: number | null;
  project_name?: string;
  /** Foreign key — associated company. */
  company_id?: number | null;
  company_name?: string;
  /** Foreign key — meeting location. */
  location_id?: number | null;
  location_name?: string;
  /** Foreign key — meeting category. */
  category_id?: number | null;
  category_name?: string;
  /** ISO timestamp of when meeting actually started. */
  started_at?: string | null;
  /** ISO timestamp of when meeting ended. */
  ended_at?: string | null;
  /** Next meeting datetime. */
  next_meeting_at?: string | null;
  /** Next meeting planning note. */
  next_meeting_note?: string;
  /** Previous meeting link info (denormalized). */
  previous?: { id: number; title: string; relation_type: string } | null;
  /** Following meetings. */
  following?: { id: number; title: string; meeting_date: string; relation_type: string }[];
}

/** Minimal shape for creating a new meeting (POST body). */
export interface MeetingCreatePayload {
  title: string;
  description?: string;
  subject?: string;
  meeting_date: string;
  planned_start?: string | null;
  project_id?: number | null;
  company_id?: number | null;
  location_id?: number | null;
  category_id?: number | null;
}

/** Shape for updating an existing meeting (PATCH body). */
export interface MeetingUpdatePayload {
  title?: string;
  description?: string;
  subject?: string;
  meeting_date?: string;
  planned_start?: string | null;
  project_id?: number | null;
  company_id?: number | null;
  location_id?: number | null;
  category_id?: number | null;
  next_meeting_at?: string | null;
  next_meeting_note?: string;
}
