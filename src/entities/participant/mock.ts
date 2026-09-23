import type { Participant } from "./model";

export const MOCK_PARTICIPANTS: Participant[] = [
  { id: 1, personId: 1, personName: "Ahmet Yılmaz", email: "ahmet@example.com", title: "Proje Müdürü", companyName: "WAM Turkey", role: "ORGANIZER", createdAt: "2026-09-20T08:00:00Z", updatedAt: "2026-09-20T08:00:00Z" },
  { id: 2, personId: 2, personName: "Elif Demir", email: "elif@example.com", title: "Yazılım Mühendisi", companyName: "WAM Turkey", role: "PRESENTER", createdAt: "2026-09-20T08:00:00Z", updatedAt: "2026-09-20T08:00:00Z" },
  { id: 3, personId: 3, personName: "Mehmet Kaya", email: "mehmet@example.com", title: "Kalite Uzmanı", companyName: "Anadolu A.Ş.", role: "ATTENDEE", createdAt: "2026-09-20T08:00:00Z", updatedAt: "2026-09-20T08:00:00Z" },
  { id: 4, personId: 4, personName: "Zeynep Arslan", email: "zeynep@example.com", title: "İK Direktörü", companyName: "WAM Turkey", role: "OBSERVER", createdAt: "2026-09-20T08:00:00Z", updatedAt: "2026-09-20T08:00:00Z" },
];
