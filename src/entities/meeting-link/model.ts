import type { BaseEntity } from "@/shared/types/common";
import type { RelationType } from "@/shared/config/constants";

export interface MeetingLink extends BaseEntity {
  linkedMeetingId: number;
  linkedMeetingTitle?: string;
  linkedMeetingDate?: string;
  relationType: RelationType;
  relationTypeDisplay?: string;
  direction: "PARENT" | "CHILD";
}
