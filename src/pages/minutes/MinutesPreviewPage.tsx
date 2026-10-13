import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSmartBack } from "@/shared/lib/navigation";
import { ArrowLeft, Download, Printer, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import type { MeetingDetail } from "@/types/api";
import { useMeetingDetail } from "@/entities/meeting/api/queries";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

export function MinutesPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetingId = Number(id);
  // Geri: geldiği yere (Takip & Terminler modalı veya toplantı detayı) — doğrudan açıldıysa toplantıya
  const { goBack, label: backLabel } = useSmartBack(`/meetings/${meetingId}`, "Toplantıya Dön");

  // Toplantı detayıyla aynı önbellek → detay sayfasından geçişte tutanak anında açılır
  const detailQuery = useMeetingDetail(meetingId);
  const meeting: MeetingDetail | null = detailQuery.data ?? null;
  const isLoading = detailQuery.isPending;
  const [isExporting, setIsExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

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

  const exportToPDF = async () => {
    if (!meeting) return;
    try {
      setIsExporting(true);
      // apiClient üzerinden → JWT otomatik eklenir, 401 interceptor devreye girer
      const { data: blob } = await apiClient.get<Blob>(`/meetings/${meeting.id}/export/pdf`, {
        responseType: "blob",
        timeout: 60_000,
      });
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
      toast.error("PDF oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!meeting) return;
    try {
      setIsExporting(true);
      const { data: blob } = await apiClient.get<Blob>(`/meetings/${meeting.id}/export/excel`, {
        responseType: "blob",
        timeout: 60_000,
      });
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
      toast.error("Excel dosyası oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none">
      {/* Actions (hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={goBack}>
          {backLabel}
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
      <div ref={documentRef} className="bg-white print:p-0">
        <div className="w-full border-[3px] border-surface-400 font-sans text-[13px] text-black">
          
          {/* Header Row */}
          <div className="flex border-b-[3px] border-surface-400">
            <div className="flex-1 border-r border-surface-300 p-2">
              <div className="font-bold mb-4">TOPLANTININ KONUSU</div>
              <div className="flex gap-2"><span className="w-4">1</span><span>Toplantı Yeri</span></div>
              <div className="flex gap-2"><span className="w-4">2</span><span>Gün ve Saat</span></div>
            </div>
            <div className="flex-1 p-2">
              <div className="font-bold mb-4">{meeting.title} | {formatDate(meeting.meetingDate, "short")}</div>
              <div className="flex gap-2 text-transparent select-none"><span className="w-4">-</span><span>-</span></div>
              <div className="flex gap-2">
                <span className="w-4 opacity-0">-</span>
                <span>{formatDate(meeting.meetingDate, "short")} {meeting.plannedStart ? `- ${meeting.plannedStart}` : ""}</span>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex border-b-[3px] border-surface-400 bg-surface-50">
            <div className="flex-1 border-r border-surface-300 p-2 font-bold">KATILIMCILAR</div>
            <div className="flex-1 p-2 font-bold">Ad ve Soyad</div>
          </div>
          <div className="border-b-[3px] border-surface-400 p-2">
            {participants.map((p, i) => {
               // Logic matches PDF: Internal -> FirmType == "INTERNAL"
               // Here we just display Company + Role (if available) vs Name
               const leftText = p.companyName ? `${p.companyName} ${p.roleDisplay !== "Belirtilmedi" ? p.roleDisplay : ""}`.trim() : (p.roleDisplay !== "Belirtilmedi" ? p.roleDisplay : "");
               return (
                 <div key={p.id} className="flex">
                   <div className="flex-1 flex gap-2"><span className="w-4">{i + 1}</span><span>{leftText || "-"}</span></div>
                   <div className="flex-1">{p.personName}</div>
                 </div>
               );
            })}
          </div>

          {/* Agenda */}
          <div className="border-b-[3px] border-surface-400 p-2">
            <div className="font-bold mb-1">TOPLANTI GÜNDEMİ</div>
            <div className="flex gap-2"><span className="w-4">1</span><span>{meeting.description || "-"}</span></div>
          </div>

          {/* Decisions */}
          <div className="border-b-[3px] border-surface-400 p-2">
            <div className="font-bold mb-1">ALINAN KARARLAR</div>
            {decisions.length > 0 ? decisions.map((d, i) => (
              <div key={d.id} className="flex gap-2"><span className="w-4">{i + 1}</span><span>{d.content}</span></div>
            )) : (
              <div className="flex gap-2"><span className="w-4">1</span><span>-</span></div>
            )}
          </div>

          {/* Important Notes / Tasks */}
          <div className="border-b-[3px] border-surface-400 p-2">
            <div className="font-bold mb-1">ÖNEMLİ NOTLAR:</div>
            {notes.filter(n => n.noteType !== "DECISION").length > 0 ? notes.filter(n => n.noteType !== "DECISION").map((n, i) => (
              <div key={n.id} className="flex gap-2">
                <span className="w-4">{i + 1}</span>
                <span>{n.content} {n.responsiblePersonName ? `(Sorumlu: ${n.responsiblePersonName})` : ""}</span>
              </div>
            )) : (
              <div className="flex gap-2"><span className="w-4">1</span><span>-</span></div>
            )}
          </div>

          {/* Next Meeting */}
          <div className="p-2">
            <div className="font-bold mb-1">BİR SONRAKİ TOPLANTI</div>
            <div className="flex gap-2">
              <span className="w-4">1</span>
              <span>
                {meeting.nextMeetingAt ? `${formatDateTime(meeting.nextMeetingAt)} ${meeting.nextMeetingNote ? `- ${meeting.nextMeetingNote}` : ""}` : "-"}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}