import type { BaseEntity } from "@/shared/types/common";
import type { RelationType } from "@/shared/config/constants";

export interface MeetingLink extends BaseEntity {
  meeting_id: number;
  previous_meeting_id: number;
  relation_type: RelationType;
  /** Denormalized for display */
  previous_title?: string;
  previous_date?: string;
}
