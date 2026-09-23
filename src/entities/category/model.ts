import type { BaseEntity } from "@/shared/types/common";

export interface MeetingCategory extends BaseEntity {
  name: string;
  isActive: boolean;
}

export interface CategoryCreatePayload {
  name: string;
}
