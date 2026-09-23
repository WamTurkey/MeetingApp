/**
 * Mock participant data for UI development and testing.
 */
import type { Participant } from "./model";

export const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: 1, meeting_id: 1, person_id: 1,
    name: "Ahmet Yılmaz", email: "ahmet.yilmaz@example.com",
    avatar_url: null, title: "Genel Müdür", company_name: "Garanti+",
    role: "ORGANIZER",
    created_at: "2026-09-20T08:00:00Z", updated_at: "2026-09-20T08:00:00Z",
  },
  {
    id: 2, meeting_id: 1, person_id: 2,
    name: "Elif Demir", email: "elif.demir@example.com",
    avatar_url: null, title: "Pazarlama Direktörü", company_name: "Garanti+",
    role: "PRESENTER",
    created_at: "2026-09-20T08:00:00Z", updated_at: "2026-09-20T08:00:00Z",
  },
  {
    id: 3, meeting_id: 1, person_id: 3,
    name: "Mehmet Kaya", email: "mehmet.kaya@example.com",
    avatar_url: null, title: "Ar-Ge Müdürü", company_name: "Anadolu",
    role: "ATTENDEE",
    created_at: "2026-09-20T08:05:00Z", updated_at: "2026-09-20T08:05:00Z",
  },
  {
    id: 4, meeting_id: 1, person_id: 4,
    name: "Zeynep Arslan", email: "zeynep.arslan@example.com",
    avatar_url: null, title: "Finans Uzmanı", company_name: "Teknik",
    role: "ATTENDEE",
    created_at: "2026-09-20T08:10:00Z", updated_at: "2026-09-20T08:10:00Z",
  },
  {
    id: 5, meeting_id: 1, person_id: 5,
    name: "Can Özkan", email: "can.ozkan@example.com",
    avatar_url: null, title: "Kalite Güvence Mühendisi",
    role: "OBSERVER",
    created_at: "2026-09-20T08:15:00Z", updated_at: "2026-09-20T08:15:00Z",
  },
  {
    id: 6, meeting_id: 3, person_id: 4,
    name: "Selin Tuncer", email: "selin.tuncer@example.com",
    avatar_url: null, title: "UX Tasarım Lideri",
    role: "PRESENTER",
    created_at: "2026-09-15T10:00:00Z", updated_at: "2026-09-15T10:00:00Z",
  },
];
