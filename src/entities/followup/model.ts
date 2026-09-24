import type { BaseEntity } from "@/shared/types/common";
import type { ActionStatus, FollowupBucket } from "@/shared/config/constants";

export interface FollowupChangeLog {
  id: number;
  changedAt: string;
  changedByName: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
}

export interface FollowupItem extends BaseEntity {
  text: string;
  topicId: number | null;
  responsiblePersonId: number | null;
  responsiblePersonName?: string;
  responsibleCompanyId: number | null;
  responsibleCompanyName?: string;
  dueDate: string | null;
  actionStatus: ActionStatus;
  actionStatusDisplay?: string;
  waitingReason: string;
  dependencyItemIds: number[];
  completedOn: string | null;
  developmentNote?: string;
  version: number;
  bucket?: FollowupBucket;
  sourceMeetingId?: number;
  sourceMeetingTitle?: string;
  sourceMeetingDate?: string;
  changeLog?: FollowupChangeLog[];
}

export interface FollowupCreatePayload {
  text: string;
  responsiblePersonId?: number;
  responsibleCompanyId?: number;
  dueDate?: string;
  actionStatus?: ActionStatus;
  waitingReason?: string;
}
