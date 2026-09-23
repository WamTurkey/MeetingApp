/**
 * Participant domain model.
 *
 * Represents a person attending a specific meeting.
 * Linked to Person entity via person_id.
 */
import type { BaseEntity } from "@/shared/types/common";

/** Participant's role within the meeting. */
export type ParticipantRole = "ORGANIZER" | "PRESENTER" | "ATTENDEE" | "OBSERVER";

export interface Participant extends BaseEntity {
  /** Foreign key — the meeting this participant belongs to. */
  meeting_id: number;
  /** Foreign key — reference to Person entity. */
  person_id: number;
  /** Full name of the participant (from Person). */
  name: string;
  /** Email address (from Person). */
  email: string;
  /** URL to the participant's avatar image (optional). */
  avatar_url: string | null;
  /** Title / department (from Person, e.g., "Yazılım Müdürü"). */
  title: string;
  /** Company name (from Person). */
  company_name?: string;
  /** Role in this specific meeting. */
  role: ParticipantRole;
}

/** Payload for adding a participant to a meeting (person_id based). */
export interface ParticipantCreatePayload {
  meeting_id: number;
  person_id: number;
  role?: ParticipantRole;
}

/** Display labels for participant roles (Turkish). */
export const PARTICIPANT_ROLE_LABEL: Record<ParticipantRole, string> = {
  ORGANIZER: "Organizatör",
  PRESENTER: "Sunum Yapan",
  ATTENDEE: "Katılımcı",
  OBSERVER: "Gözlemci",
};
