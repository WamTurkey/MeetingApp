import { useState, useRef, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSmartBack } from "@/shared/lib/navigation";
import { ArrowLeft, Download, Printer, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import type { MeetingDetail } from "@/types/api";
import { useMeetingDetail } from "@/entities/meeting/api/queries";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

function NumberedLine({ index, children }: { index: number | string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="w-4 shrink-0 tabular-nums">{index}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </div>
  );
}

function TwoCol({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2", className)}>
      <div className={cn("min-w-0 break-words border-surface-300 p-2 sm:border-r print:border-r", leftClassName)}>
        {left}
      </div>
      <div className={cn("min-w-0 break-words border-t border-surface-300 p-2 sm:border-t-0 print:border-t-0", rightClassName)}>
        {right}
      </div>
    </div>
  );
}

export function MinutesPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meetingId = Number(id);
  // Geri: geldiği yere (Takip & Terminler modalı veya toplantı detayı) — doğrudan açıldıysa toplantıya
  const { goBack } = useSmartBack(`/meetings/${meetingId}`, "Toplantıya Dön");

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

  const bodyNotes = notes.filter((n) => n.noteType !== "DECISION");

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-4 print:max-w-none">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={goBack}
          aria-label="Geri"
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 shrink-0 px-0 sm:h-8 sm:w-auto sm:px-3"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={exportToExcel}
            aria-label="Excel İndir"
          >
            <span className="hidden sm:inline">Excel İndir</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 shrink-0 px-0 sm:h-8 sm:w-auto sm:px-3"
            icon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={exportToPDF}
            disabled={isExporting}
            aria-label={isExporting ? "İndiriliyor" : "PDF İndir"}
          >
            <span className="hidden sm:inline">{isExporting ? "İndiriliyor..." : "PDF İndir"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 shrink-0 px-0 sm:h-8 sm:w-auto sm:px-3"
            icon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
            aria-label="Yazdır"
          >
            <span className="hidden sm:inline">Yazdır</span>
          </Button>
        </div>
      </div>

      <div ref={documentRef} className="min-w-0 bg-white print:p-0">
        <div className="w-full min-w-0 overflow-hidden border-2 border-surface-400 font-sans text-[12px] leading-snug text-black [overflow-wrap:anywhere] sm:border-[3px] sm:text-[13px] sm:leading-normal">
          <TwoCol
            className="border-b-2 border-surface-400 sm:border-b-[3px]"
            left={
              <>
                <div className="mb-3 font-bold">TOPLANTININ KONUSU</div>
                <NumberedLine index={1}>Yer</NumberedLine>
                <NumberedLine index={2}>Gün ve Saat</NumberedLine>
              </>
            }
            right={
              <>
                <div className="mb-3 font-bold">
                  {meeting.title} | {formatDate(meeting.meetingDate, "short")}
                </div>
                <NumberedLine index="">
                  {meeting.locationName?.trim() ? meeting.locationName : "—"}
                </NumberedLine>
                <NumberedLine index="">
                  {formatDate(meeting.meetingDate, "short")}
                  {meeting.plannedStart ? ` - ${meeting.plannedStart}` : ""}
                </NumberedLine>
              </>
            }
          />

          <div className="border-b-2 border-surface-400 bg-surface-50 p-2 font-bold sm:hidden">
            KATILIMCILAR
          </div>
          <TwoCol
            className="hidden border-b-[3px] border-surface-400 bg-surface-50 sm:grid print:grid"
            left={<div className="font-bold">KATILIMCILAR</div>}
            right={<div className="font-bold">Ad ve Soyad</div>}
          />

          <div className="border-b-2 border-surface-400 sm:border-b-[3px]">
            {participants.map((p, i) => {
              const leftText = p.companyName
                ? `${p.companyName} ${p.roleDisplay !== "Belirtilmedi" ? p.roleDisplay : ""}`.trim()
                : p.roleDisplay !== "Belirtilmedi"
                  ? p.roleDisplay
                  : "";
              return (
                <TwoCol
                  key={p.id}
                  className={i > 0 ? "border-t border-surface-200 sm:border-t-0" : undefined}
                  leftClassName="py-1.5 sm:py-2"
                  rightClassName="py-1.5 sm:py-2"
                  left={<NumberedLine index={i + 1}>{leftText || "-"}</NumberedLine>}
                  right={<div className="pl-6 sm:pl-0">{p.personName}</div>}
                />
              );
            })}
          </div>

          <div className="border-b-2 border-surface-400 p-2 sm:border-b-[3px]">
            <div className="mb-1 font-bold">TOPLANTI GÜNDEMİ</div>
            <NumberedLine index={1}>{meeting.description || "-"}</NumberedLine>
          </div>

          <div className="border-b-2 border-surface-400 p-2 sm:border-b-[3px]">
            <div className="mb-1 font-bold">NOTLAR</div>
            {bodyNotes.length > 0 ? (
              bodyNotes.map((n, i) => (
                <NumberedLine key={n.id} index={i + 1}>
                  {n.content}
                  {n.responsiblePersonName ? ` (Sorumlu: ${n.responsiblePersonName})` : ""}
                </NumberedLine>
              ))
            ) : (
              <NumberedLine index={1}>-</NumberedLine>
            )}
          </div>

          <div className="border-b-2 border-surface-400 p-2 sm:border-b-[3px]">
            <div className="mb-1 font-bold">ALINAN KARARLAR</div>
            {decisions.length > 0 ? (
              decisions.map((d, i) => (
                <NumberedLine key={d.id} index={i + 1}>
                  {d.content}
                </NumberedLine>
              ))
            ) : (
              <NumberedLine index={1}>-</NumberedLine>
            )}
          </div>

          <div className="p-2">
            <div className="mb-1 font-bold">BİR SONRAKİ TOPLANTI</div>
            <NumberedLine index={1}>
              {meeting.nextMeetingAt
                ? `${formatDateTime(meeting.nextMeetingAt)}${meeting.nextMeetingNote ? ` - ${meeting.nextMeetingNote}` : ""}`
                : "-"}
            </NumberedLine>
          </div>
        </div>
      </div>
    </div>
  );
}