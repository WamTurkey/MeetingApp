import type { BaseEntity } from "@/shared/types/common";

export interface MeetingCategory extends BaseEntity {
  name: string;
  active: boolean;
}

export interface CategoryCreatePayload {
  name: string;
  active?: boolean;
}
