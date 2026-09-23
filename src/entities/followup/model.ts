import type { BaseEntity } from "@/shared/types/common";
import type { ActionStatus, FollowupBucket } from "@/shared/config/constants";

/** A single change log entry for tracking modifications. */
export interface FollowupChangeLog {
  id: number;
  timestamp: string;
  user_name: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  field?: string;
  old_value?: string;
  new_value?: string;
  description: string;
}

export interface FollowupItem extends BaseEntity {
  text: string;
  topic_id: number | null;
  responsible_person_id: number | null;
  responsible_person_name?: string;
  responsible_company_id: number | null;
  responsible_company_name?: string;
  due_date: string | null;
  status: ActionStatus;
  waiting_reason: string;
  blocker_item_id: number | null;
  blocker_item_text?: string;
  completed_on: string | null;
  development_note?: string;
  version: number;
  /** Computed from due_date + status */
  bucket: FollowupBucket;
  /** Source meeting info */
  source_meeting_id?: number;
  source_meeting_title?: string;
  source_meeting_date?: string;
  /** Change history */
  change_log?: FollowupChangeLog[];
}

export interface FollowupCreatePayload {
  text: string;
  responsible_person_id?: number | null;
  responsible_company_id?: number | null;
  due_date?: string | null;
  status?: ActionStatus;
  waiting_reason?: string;
}
