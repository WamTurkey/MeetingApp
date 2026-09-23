import type { Project } from "./model";

export const MOCK_PROJECTS: Project[] = [
  { id: 1, name: "İstanbul Havalimanı 3. Pist", code: "IGA-3", active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Ankara OSB Altyapı", code: "ANK-OSB", active: true, created_at: "2026-02-15T00:00:00Z", updated_at: "2026-02-15T00:00:00Z" },
  { id: 3, name: "Bursa Metro Uzatma", code: "BRS-MET", active: false, created_at: "2025-06-01T00:00:00Z", updated_at: "2025-12-01T00:00:00Z" },
];
