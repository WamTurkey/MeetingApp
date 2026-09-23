/**
 * Note domain model.
 *
 * Represents a single note/decision/task attached to a meeting.
 */
import type { BaseEntity } from "@/shared/types/common";
import type { NoteType, ActionStatus } from "@/shared/config/constants";

export interface Note extends BaseEntity {
  /** Foreign key — the meeting this note belongs to. */
  meeting_id: number;
  /** The textual content of the note. */
  content: string;
  /** Semantic type classification. */
  type: NoteType;
  /** Display order within the meeting. */
  order: number;
  /** User ID who created this note. */
  created_by: number;
  /** Display name of the creator. */
  created_by_name: string;
  /** Foreign key — person responsible for this action/task. */
  responsible_person_id?: number | null;
  /** Display name of the responsible person. */
  responsible_person_name?: string;
  /** Due date for tasks (YYYY-MM-DD). */
  due_date?: string | null;
  /** Status for action/task items. */
  status?: ActionStatus;
  /** Stable topic identifier for cross-meeting tracking. */
  topic_id?: number | null;
}

/** Payload for creating a new note. */
export interface NoteCreatePayload {
  meeting_id: number;
  content: string;
  type: NoteType;
  responsible_person_id?: number | null;
  due_date?: string | null;
  status?: ActionStatus;
}

/** Payload for updating an existing note. */
export interface NoteUpdatePayload {
  content?: string;
  type?: NoteType;
  responsible_person_id?: number | null;
  due_date?: string | null;
  status?: ActionStatus;
}
