import type { Person } from "./model";

export const MOCK_PEOPLE: Person[] = [
  { id: 1, fullName: "Ahmet Yılmaz", companyId: 1, companyName: "WAM Turkey", title: "Proje Müdürü", email: "ahmet@example.com", phone: "0532 111 22 33", isActive: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: 2, fullName: "Elif Demir", companyId: 1, companyName: "WAM Turkey", title: "Yazılım Mühendisi", email: "elif@example.com", phone: "0533 222 33 44", isActive: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: 3, fullName: "Mehmet Kaya", companyId: 2, companyName: "Anadolu A.Ş.", title: "Kalite Uzmanı", email: "mehmet@example.com", phone: "0534 333 44 55", isActive: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: 4, fullName: "Zeynep Arslan", companyId: 1, companyName: "WAM Turkey", title: "İK Direktörü", email: "zeynep@example.com", phone: "0535 444 55 66", isActive: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
];
