import type { BaseEntity } from "@/shared/types/common";

export interface Location extends BaseEntity {
  name: string;
  isActive: boolean;
}

export interface LocationCreatePayload {
  name: string;
}
