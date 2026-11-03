import { useMemo, useState } from "react";
import { CalendarPlus, GitBranch, Loader2, Plus, Sparkles, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import type { MeetingDetail } from "@/types/api";
import { useMeetingChain } from "@/entities/meeting/api/useMeetingChain";
import type { MeetingChainNode } from "@/entities/meeting/model/chain";
import { GenerateCeoReportModal, getGeminiApiKey } from "@/features/ai-ceo-report";
import { AttachPastMeetingModal } from "@/features/meeting-chain-link";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatDate, toIstanbulDateKey } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/cn";

export interface MeetingHistoryChainPanelProps {
  detail: MeetingDetail;
  onPlanNext?: () => void;
}

function isFutureDate(meetingDate: string): boolean {
  return meetingDate > toIstanbulDateKey();
}

function isPastDate(meetingDate: string): boolean {
  return meetingDate < toIstanbulDateKey();
}

export function MeetingHistoryChainPanel({ detail, onPlanNext }: MeetingHistoryChainPanelProps) {
  const { chain, isLoading, error } = useMeetingChain(detail);
  const [selected, setSelected] = useState<Set<number>>(() => new Set([detail.id]));
  const [reportOpen, setReportOpen] = useState(false);
  const [attachAnchorId, setAttachAnchorId] = useState<number | null>(null);

  const nodes = chain?.nodes ?? [];
  const selectedIds = useMemo(() => [...selected], [selected]);
  const chainIds = useMemo(() => nodes.map((node) => node.id), [nodes]);

  function toggle(id: number, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function openReport() {
    if (selected.size === 0) return;
    if (!getGeminiApiKey()) {
      toast.error("Gemini API anahtarı tanımlı değil", {
        description: "VITE_GEMINI_API_KEY değerini ortam değişkenine ekleyin.",
      });
      return;
    }
    setReportOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-surface-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Toplantı zinciri yükleniyor…
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<GitBranch className="h-8 w-8" />}
        title="Zincir yüklenemedi"
        description={error}
      />
    );
  }

  return (
    <div className="relative space-y-4 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C8D5D1] bg-surface-100/80 px-3 py-1.5 text-xs font-semibold text-surface-700 backdrop-blur dark:border-surface-700 dark:bg-surface-900/60 dark:text-surface-200">
          <GitBranch className="h-3.5 w-3.5 text-brand-600" />
          {Math.max(nodes.length, 1)} Halkalı Zincir
        </div>
        <p className="text-xs text-surface-500">Sıra tarihe göredir · CEO için halka seçin</p>
      </div>

      {nodes.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-8 w-8" />}
          title="Zincir henüz oluşmadı"
          description="Bu toplantıdan önceki bir oturumu bağlayın veya serinin bir sonraki adımını planlayın."
          action={
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAttachAnchorId(detail.id)}>
                Önceki oturumu bağla
              </Button>
              {onPlanNext && (
                <Button type="button" variant="primary" size="sm" icon={<CalendarPlus className="h-4 w-4" />} onClick={onPlanNext}>
                  Sonraki toplantıyı planla
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <ol className="relative space-y-0 pl-0 sm:pl-2">
          {nodes.map((node, index) => {
            const future = isFutureDate(node.meetingDate);
            const past = isPastDate(node.meetingDate);
            const isCurrent = node.id === detail.id;
            const isLast = index === nodes.length - 1;
            return (
              <li key={node.id} className="relative">
                <InsertTrigger onClick={() => setAttachAnchorId(node.id)} label="Geçmiş toplantı bağla" />

                <div className="relative flex gap-3 sm:gap-4">
                  <div className="flex w-10 shrink-0 flex-col items-center sm:w-12">
                    <span
                      className={cn(
                        "relative z-[1] mt-5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-soft dark:border-surface-900",
                        isCurrent && "bg-brand-600 shadow-[0_0_0_4px_rgba(37,99,235,0.2)] animate-pulse",
                        !isCurrent && past && "bg-[#9DB5AF]/70",
                        !isCurrent && future && "border-dashed border-[#9DB5AF] bg-transparent",
                        !isCurrent && !past && !future && "bg-[#9DB5AF]",
                      )}
                      aria-hidden
                    />
                    {!isLast && (
                      <span
                        className={cn(
                          "mt-1 w-px flex-1 min-h-[3.5rem]",
                          future ? "border-l border-dashed border-[#ACBFBB]" : "bg-[#ACBFBB] dark:bg-surface-700",
                        )}
                        aria-hidden
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-4">
                    <p
                      className={cn(
                        "mb-1.5 font-mono text-[11px] tracking-wide",
                        isCurrent ? "font-semibold text-brand-700 dark:text-brand-300" : "text-surface-400",
                        past && !isCurrent && "opacity-70",
                      )}
                    >
                      {formatDate(node.meetingDate, "long")}
                      {isCurrent ? " · Bu toplantı" : ""}
                      {future ? " · Planlanan" : ""}
                    </p>
                    <ChainCard
                      node={node}
                      isCurrent={isCurrent}
                      isPast={past && !isCurrent}
                      checked={selected.has(node.id)}
                      onCheckedChange={(checked) => toggle(node.id, checked)}
                    />
                  </div>
                </div>
              </li>
            );
          })}

          <li className="relative flex gap-3 sm:gap-4">
            <div className="flex w-10 shrink-0 justify-center sm:w-12">
              <span className="mt-2 h-3 w-3 rounded-full border border-dashed border-[#9DB5AF]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2 pb-2">
              {nodes.length === 1 && (
                <p className="text-xs text-surface-500">
                  Bu serinin bir sonraki adımını planlayın veya üstteki + ile önceki bir oturumu bağlayın.
                </p>
              )}
              {onPlanNext && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start rounded-[20px] border-dashed border-[#ACBFBB] bg-surface-100/60 px-4 py-3.5 text-sm backdrop-blur dark:bg-surface-900/40"
                  icon={<CalendarPlus className="h-4 w-4" />}
                  onClick={onPlanNext}
                >
                  Sonraki toplantıyı planla
                </Button>
              )}
            </div>
          </li>
        </ol>
      )}

      <div className="sticky bottom-3 z-10 space-y-2 rounded-[20px] border border-[#C8D5D1] bg-white/95 p-3 shadow-elevated backdrop-blur dark:border-surface-700 dark:bg-surface-900/95">
        <Button
          type="button"
          variant="primary"
          className="h-auto w-full rounded-full py-3.5 text-sm"
          icon={<Sparkles className="h-4 w-4" />}
          disabled={selected.size === 0}
          onClick={openReport}
        >
          Seçilen {selected.size} toplantı için AI CEO raporu üret
        </Button>
      </div>

      <GenerateCeoReportModal
        isOpen={reportOpen}
        meetingIds={selectedIds}
        onClose={() => setReportOpen(false)}
      />

      <AttachPastMeetingModal
        isOpen={attachAnchorId != null}
        onClose={() => setAttachAnchorId(null)}
        anchorMeetingId={attachAnchorId ?? detail.id}
        excludedMeetingIds={chainIds}
      />
    </div>
  );
}

function InsertTrigger({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="relative z-[1] -mb-1 flex items-center gap-3 py-1 pl-0 sm:pl-2">
      <div className="flex w-10 justify-center sm:w-12">
        <button
          type="button"
          onClick={onClick}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#C8D5D1] bg-white text-surface-500 shadow-soft transition hover:border-brand-400 hover:text-brand-600 dark:border-surface-600 dark:bg-surface-900"
          aria-label={label}
          title={label}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="hidden text-[11px] text-surface-400 sm:inline">{label}</span>
    </div>
  );
}

function ChainCard({
  node,
  isCurrent,
  isPast,
  checked,
  onCheckedChange,
}: {
  node: MeetingChainNode;
  isCurrent: boolean;
  isPast: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-[20px] border p-4 shadow-soft backdrop-blur",
        "bg-surface-100/80 dark:bg-surface-900/70",
        isCurrent && "border-brand-400 ring-1 ring-brand-500/25 dark:border-brand-500",
        !isCurrent && "border-[#C8D5D1] dark:border-surface-700",
        isPast && "opacity-85",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
            {node.title}
          </h3>
          <div className="flex flex-wrap gap-3 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {node.participantCount} katılımcı
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {node.noteCount} not
            </span>
          </div>
        </div>
        <Checkbox
          label="CEO raporuna dahil et"
          checked={checked}
          onChange={onCheckedChange}
          className="sm:max-w-[11rem]"
        />
      </div>
    </article>
  );
}
