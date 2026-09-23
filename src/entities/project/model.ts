import type { BaseEntity } from "@/shared/types/common";

export interface Project extends BaseEntity {
  name: string;
  code: string;
  active: boolean;
}

export interface ProjectCreatePayload {
  name: string;
  code?: string;
  active?: boolean;
}
