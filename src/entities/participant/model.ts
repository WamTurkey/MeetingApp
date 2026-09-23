import type { BaseEntity } from "@/shared/types/common";

export type ParticipantRole = "ORGANIZER" | "PRESENTER" | "ATTENDEE" | "OBSERVER";

export interface Participant extends BaseEntity {
  meetingId?: number;
  personId: number;
  personName: string;
  email?: string;
  avatarUrl?: string | null;
  title?: string;
  companyName?: string;
  role: ParticipantRole;
  roleDisplay?: string;
}

export interface ParticipantCreatePayload {
  personId: number;
  role?: ParticipantRole;
}

export const PARTICIPANT_ROLE_LABEL: Record<ParticipantRole, string> = {
  ORGANIZER: "Organizatör",
  PRESENTER: "Sunum Yapan",
  ATTENDEE: "Katılımcı",
  OBSERVER: "Gözlemci",
};
