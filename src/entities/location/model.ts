import type { BaseEntity } from "@/shared/types/common";

export interface Location extends BaseEntity {
  name: string;
  active: boolean;
}

export interface LocationCreatePayload {
  name: string;
  active?: boolean;
}
