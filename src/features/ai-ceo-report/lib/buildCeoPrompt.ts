import type { AttachmentDto, MeetingDetail, NoteDto } from "@/types/api";

export interface MeetingReportBundle {
  detail: MeetingDetail;
  voiceTranscripts: string[];
}

function noteLines(notes: NoteDto[], type?: string): string[] {
  return notes
    .filter((note) => (type ? note.noteType === type : note.noteType !== "DECISION"))
    .map((note) => `- ${note.content}${note.dueDate ? ` (termin: ${note.dueDate})` : ""}`);
}

export function formatMeetingBundle(bundle: MeetingReportBundle): string {
  const { detail, voiceTranscripts } = bundle;
  const agenda = detail.subject || detail.description || "Belirtilmedi";
  const notes = noteLines(detail.notes ?? []);
  const decisions = noteLines(detail.notes ?? [], "DECISION");
  const transcripts =
    voiceTranscripts.length > 0
      ? voiceTranscripts.map((text, index) => `### Ses dökümü ${index + 1}\n${text}`).join("\n\n")
      : "Yok";

  return [
    `## Toplantı #${detail.id} — ${detail.title}`,
    `Tarih: ${detail.meetingDate}`,
    `Gündem: ${agenda}`,
    "",
    "### Notlar",
    notes.length > 0 ? notes.join("\n") : "Yok",
    "",
    "### Alınan kararlar",
    decisions.length > 0 ? decisions.join("\n") : "Yok",
    "",
    "### Ses dökümleri",
    transcripts,
  ].join("\n");
}

export function buildCeoPrompt(bundles: MeetingReportBundle[]): string {
  const sorted = [...bundles].sort(
    (a, b) =>
      a.detail.meetingDate.localeCompare(b.detail.meetingDate) || a.detail.id - b.detail.id,
  );
  const body = sorted.map(formatMeetingBundle).join("\n\n---\n\n");

  return [
    "Rolün: Kurumsal Strateji ve Yönetim Danışmanı / CEO Asistanı.",
    "Aşağıda aynı konu/proje zincirinden seçilmiş toplantıların gündem, not, karar ve ses döküm metinleri kronolojik sıradadır.",
    "Ses dosyası yok; yalnızca metin dökümleri vardır.",
    "",
    "Çıktını Türkçe Markdown olarak şu dört başlık altında ver (başka giriş/çıkış metni yazma):",
    "",
    "## Genel Gidişat ve İlerleme Özeti",
    "Proje veya konu nereden başladı, nereye evrildi?",
    "",
    "## Kronikleşen Riskler ve Engeller",
    "Tekrarlayan sorunlar ve çözülemeyen engeller.",
    "",
    "## Kritik Kararların Değerlendirmesi",
    "Alınan kritik kararların etkisi ve tutarlılığı.",
    "",
    "## CEO İçin Stratejik Sonraki Adımlar",
    "Somut, önceliklendirilmiş öneriler.",
    "",
    "---",
    "",
    body,
  ].join("\n");
}

export function voiceTranscriptsFromAttachments(attachments: AttachmentDto[]): string[] {
  return attachments
    .filter((att) => att.category === "VOICE_NOTE" && Boolean(att.description?.trim()))
    .map((att) => att.description!.trim());
}
