/**
 * Mock note data for UI development and testing.
 *
 * Notes are tied to meetings via `meeting_id`. Covers all
 * four NoteType values (NOTE, DECISION, TASK, INFO).
 */
import type { Note } from "./model";

export const MOCK_NOTES: Note[] = [
  {
    id: 1,
    meeting_id: 1,
    content:
      "Q3 bütçe kullanım oranı %78 olarak gerçekleşti. Kalan %22'lik bölüm Q4'e devredilecek.",
    type: "INFO",
    order: 1,
    created_by: 1,
    created_by_name: "Ahmet Yılmaz",
    created_at: "2026-09-22T09:10:00Z",
    updated_at: "2026-09-22T09:10:00Z",
  },
  {
    id: 2,
    meeting_id: 1,
    content:
      "Yeni pazar genişlemesi için Güneydoğu Anadolu bölgesi öncelikli hedef olarak belirlendi.",
    type: "DECISION",
    order: 2,
    created_by: 1,
    created_by_name: "Ahmet Yılmaz",
    created_at: "2026-09-22T09:25:00Z",
    updated_at: "2026-09-22T09:25:00Z",
  },
  {
    id: 3,
    meeting_id: 1,
    content:
      "Bölgesel pazar araştırması raporu 15 Ekim'e kadar hazırlanacak. Sorumlu: Pazarlama Departmanı.",
    type: "TASK",
    order: 3,
    created_by: 2,
    created_by_name: "Elif Demir",
    created_at: "2026-09-22T09:30:00Z",
    updated_at: "2026-09-22T09:30:00Z",
  },
  {
    id: 4,
    meeting_id: 1,
    content:
      "Departman hedefleri genel olarak tutarlı bulundu, ancak Ar-Ge bütçesinde %10 artış talep edildi.",
    type: "NOTE",
    order: 4,
    created_by: 3,
    created_by_name: "Mehmet Kaya",
    created_at: "2026-09-22T09:45:00Z",
    updated_at: "2026-09-22T09:45:00Z",
  },
  {
    id: 5,
    meeting_id: 3,
    content:
      "Kullanılabilirlik testi sonuçlarına göre onboarding akışı yeniden tasarlanacak.",
    type: "DECISION",
    order: 1,
    created_by: 2,
    created_by_name: "Elif Demir",
    created_at: "2026-09-18T14:00:00Z",
    updated_at: "2026-09-18T14:00:00Z",
  },
  {
    id: 6,
    meeting_id: 3,
    content:
      "Müşteri memnuniyet anketi NPS skoru: 42 (önceki dönem: 38). Olumlu trend devam ediyor.",
    type: "INFO",
    order: 2,
    created_by: 1,
    created_by_name: "Ahmet Yılmaz",
    created_at: "2026-09-18T14:15:00Z",
    updated_at: "2026-09-18T14:15:00Z",
  },
  {
    id: 7,
    meeting_id: 3,
    content:
      "UX ekibi yeni onboarding prototipini 2 hafta içinde sunacak.",
    type: "TASK",
    order: 3,
    created_by: 2,
    created_by_name: "Elif Demir",
    created_at: "2026-09-18T14:30:00Z",
    updated_at: "2026-09-18T14:30:00Z",
  },
];
