/**
 * Mock meeting data for UI development and testing.
 *
 * Each entry mirrors the exact shape returned by `GET /api/v1/meetings`.
 */
import type { Meeting } from "./model";

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 1,
    title: "2026 Q3 Stratejik Planlama Toplantısı",
    description:
      "Yıllık bütçe değerlendirmesi, yeni pazar genişleme stratejileri ve departman hedeflerinin gözden geçirilmesi.",
    meeting_date: "2026-09-22",
    status: "ACTIVE",
    version: 1,
    location_name: "Merkez Ofis - Toplantı Salonu A",
    planned_start: "14:00",
    created_at: "2026-09-20T08:00:00Z",
    updated_at: "2026-09-20T09:15:00Z",
  },
  {
    id: 2,
    title: "Sprint 14 — Retrospektif",
    description:
      "Önceki sprint döngüsünün analizi, engelleyici sorunların çözümü ve süreç iyileştirme kararları.",
    meeting_date: "2026-09-25",
    status: "DRAFT",
    version: 0,
    location_name: "Ar-Ge Merkezi - Agile Odası",
    planned_start: "10:00",
    created_at: "2026-09-19T14:30:00Z",
    updated_at: "2026-09-19T14:30:00Z",
  },
  {
    id: 3,
    title: "Müşteri Geri Bildirim Değerlendirmesi",
    description:
      "Ürün kullanılabilirlik testi sonuçları ve müşteri şikâyet trendleri üzerine tartışma.",
    meeting_date: "2026-09-18",
    status: "COMPLETED",
    version: 2,
    location_name: "İstanbul Bölge Ofisi - B3 Katı",
    planned_start: "09:30",
    created_at: "2026-09-15T10:00:00Z",
    updated_at: "2026-09-18T16:45:00Z",
  },
  {
    id: 4,
    title: "Bilgi Güvenliği Komite Toplantısı",
    description:
      "ISO 27001 denetim hazırlıkları, zafiyet tarama sonuçları ve politika güncellemeleri.",
    meeting_date: "2026-09-10",
    status: "EXPORTED",
    version: 3,
    location_name: "Yönetim Ofisi Turuncu Toplantı Odası",
    planned_start: "16:00",
    created_at: "2026-09-05T09:00:00Z",
    updated_at: "2026-09-12T11:00:00Z",
  },
  {
    id: 5,
    title: "Yeni Personel Oryantasyonu",
    description:
      "Eylül dönemi yeni katılımcıları için şirket kültürü, sistemler ve organizasyon yapısı tanıtımı.",
    meeting_date: "2026-09-28",
    status: "DRAFT",
    version: 0,
    created_at: "2026-09-21T07:00:00Z",
    updated_at: "2026-09-21T07:00:00Z",
  },
  {
    id: 6,
    title: "Ar-Ge Proje İlerleme Değerlendirmesi",
    description:
      "Devam eden Ar-Ge projelerinin durum raporu, bütçe kullanımı ve zaman çizelgesi güncellemesi.",
    meeting_date: "2026-09-30",
    status: "DRAFT",
    version: 0,
    created_at: "2026-09-22T11:30:00Z",
    updated_at: "2026-09-22T11:30:00Z",
  },
];
