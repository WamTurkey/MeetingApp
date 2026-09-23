import type { BaseEntity } from "@/shared/types/common";
import type { MeetingStatus } from "@/shared/config/constants";

export interface Meeting extends BaseEntity {
  title: string;
  description: string;
  subject?: string;
  meetingDate: string;
  plannedStart?: string | null;
  status: MeetingStatus;
  statusDisplay?: string;
  version: number;
  projectId?: number | null;
  projectName?: string | null;
  companyId?: number | null;
  companyName?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  nextMeetingAt?: string | null;
  nextMeetingNote?: string;
  participantCount?: number;
  noteCount?: number;
}

export interface MeetingCreatePayload {
  title: string;
  description?: string;
  subject?: string;
  meetingDate: string;
  plannedStart?: string;
  projectId?: number;
  companyId?: number;
  locationId?: number;
  categoryId?: number;
  nextMeetingNote?: string;
}

export interface MeetingUpdatePayload {
  title: string;
  description?: string;
  subject?: string;
  meetingDate: string;
  plannedStart?: string;
  status: string;
  projectId?: number;
  companyId?: number;
  locationId?: number;
  categoryId?: number;
  nextMeetingAt?: string;
  nextMeetingNote?: string;
}
