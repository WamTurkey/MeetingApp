import type { BaseEntity } from "@/shared/types/common";
import type { NoteType, ActionStatus } from "@/shared/config/constants";

export interface Note extends BaseEntity {
  meetingId: number;
  content: string;
  noteType: NoteType;
  noteTypeDisplay?: string;
  displayOrder: number;
  createdBy?: number;
  createdByName?: string;
  responsiblePersonId?: number | null;
  responsiblePersonName?: string;
  dueDate?: string | null;
  actionStatus?: ActionStatus;
  actionStatusDisplay?: string;
  topicId?: number | null;
}

export interface NoteCreatePayload {
  content: string;
  noteType?: NoteType;
  displayOrder?: number;
  responsiblePersonId?: number;
  dueDate?: string;
  actionStatus?: ActionStatus;
}

export interface NoteUpdatePayload {
  content: string;
  noteType: NoteType;
  displayOrder: number;
  responsiblePersonId?: number;
  dueDate?: string;
  actionStatus?: ActionStatus;
}
