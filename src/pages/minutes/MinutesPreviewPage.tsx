import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { NOTE_TYPE_LABEL, NOTE_TYPE_BADGE_VARIANT } from "@/entities/note/constants";
import type { NoteType } from "@/shared/config/constants";
import { fetchMeetingById } from "@/services/meetingService";
import type { MeetingDetail } from "@/types/api";

export function MinutesPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetingId = Number(id);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const detail = await fetchMeetingById(meetingId);
        setMeeting(detail);
      } catch (err) { console.error("[MinutesPreview] Load error:", err); }
      finally { setIsLoading(false); }
    })();
  }, [meetingId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <span className="ml-3 text-surface-500">Tutanak yükleniyor…</span>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="py-24 text-center">
        <p className="text-danger-600">Toplantı bulunamadı.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/meetings")}>Geri Dön</Button>
      </div>
    );
  }

  const notes = meeting.notes;
  const participants = meeting.participants;
  const decisions = notes.filter((n) => n.noteType === "DECISION");
  const tasks = notes.filter((n) => n.noteType === "TASK");
  const infoNotes = notes.filter((n) => n.noteType === "INFO" || n.noteType === "NOTE");

  const exportToPDF = async () => {
    if (!meeting) return;
    try {
      setIsExporting(true);
      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5180/api"}/meetings/${meeting.id}/export/pdf`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        }
      });
      if (!response.ok) throw new Error("PDF Export failed");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Tutanak_${meeting.id}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!meeting) return;
    try {
      setIsExporting(true);
      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5180/api"}/meetings/${meeting.id}/export/excel`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Tutanak_${meeting.id}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Excel Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none">
      {/* Actions (hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(`/meetings/${meetingId}`)}>
          Toplantıya Dön
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportToExcel}>Excel İndir</Button>
          <Button variant="outline" size="sm" icon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} onClick={exportToPDF} disabled={isExporting}>
            {isExporting ? "İndiriliyor..." : "PDF İndir"}
          </Button>
          <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Yazdır</Button>
        </div>
      </div>

      {/* Tutanak Document */}
      <div ref={documentRef} className="rounded-xl border border-surface-200 bg-white p-8 shadow-card dark:border-surface-700 dark:bg-surface-800 print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <header className="mb-8 border-b border-surface-200 pb-6 dark:border-surface-700">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {meeting.title}
              </h1>
              <p className="mt-2 text-sm text-surface-500">
                <span className="font-medium text-surface-900 dark:text-surface-50">TOPLANTI TUTANAĞI</span>
              </p>
            </div>
            <div className="text-right text-sm text-surface-500 dark:text-surface-400">
              <p>{formatDate(meeting.meetingDate, "weekday")}</p>
              <p>{meeting.plannedStart ? `Saat: ${meeting.plannedStart}` : ""}</p>
              {meeting.locationName && <p>Yer: {meeting.locationName}</p>}
            </div>
          </div>
          {meeting.description && (
            <p className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
              <span className="font-semibold">Gündem:</span> {meeting.description}
            </p>
          )}
        </header>

        {/* Participants */}
        {participants.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">Katılımcılar</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="py-2 text-left font-medium text-surface-500 dark:text-surface-400">Ad Soyad</th>
                  <th className="py-2 text-left font-medium text-surface-500 dark:text-surface-400">Firma</th>
                  <th className="py-2 text-left font-medium text-surface-500 dark:text-surface-400">Rol</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-surface-100 dark:border-surface-700/50">
                    <td className="py-2 text-surface-900 dark:text-surface-50">{p.personName}</td>
                    <td className="py-2 text-surface-600 dark:text-surface-400">{p.companyName ?? "—"}</td>
                    <td className="py-2 text-surface-600 dark:text-surface-400">{p.roleDisplay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-brand-700 dark:text-brand-400">📋 Kararlar</h2>
            <ol className="list-decimal list-inside space-y-2">
              {decisions.map((n) => (
                <li key={n.id} className="text-sm text-surface-800 leading-relaxed dark:text-surface-200">
                  {n.content}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-warning-700 dark:text-warning-400">⚡ Görevler</h2>
            <div className="space-y-2">
              {tasks.map((n) => (
                <div key={n.id} className="rounded-lg border border-surface-100 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
                  <p className="text-sm text-surface-800 dark:text-surface-200">{n.content}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {n.responsiblePersonName && (
                      <span className="text-surface-500">Sorumlu: {n.responsiblePersonName}</span>
                    )}
                    {n.dueDate && (
                      <span className="text-surface-500">Termin: {formatDate(n.dueDate, "short")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info Notes */}
        {infoNotes.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">📝 Notlar</h2>
            <div className="space-y-3">
              {infoNotes.map((n) => (
                <div key={n.id} className="text-sm leading-relaxed text-surface-700 dark:text-surface-300 border-l-2 border-surface-300 pl-3 dark:border-surface-600">
                  <Badge variant={NOTE_TYPE_BADGE_VARIANT[n.noteType as NoteType]} size="sm">
                    {NOTE_TYPE_LABEL[n.noteType as NoteType]}
                  </Badge>
                  <p className="mt-1">{n.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next Meeting */}
        <section className="border-t border-surface-200 pt-6 dark:border-surface-700">
          <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">🔜 Sonraki Toplantı</h2>
          {meeting.nextMeetingAt ? (
            <div className="text-sm text-surface-800 dark:text-surface-200">
              <p>Tarih: {formatDateTime(meeting.nextMeetingAt)}</p>
              {meeting.nextMeetingNote && <p className="mt-1">{meeting.nextMeetingNote}</p>}
            </div>
          ) : (
            <p className="text-sm text-surface-400 italic">Henüz planlanmadı.</p>
          )}
        </section>
      </div>
    </div>
  );
}
