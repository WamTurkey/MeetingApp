import { useEffect, useMemo, useRef, useState } from "react";
import { GitBranch, Link2, Loader2, MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { useAddMeetingLink } from "@/entities/meeting/api/mutations";
import { resolveMeetingChain } from "@/entities/meeting/api/resolveMeetingChainIds";
import type { MeetingChainNode } from "@/entities/meeting/model/chain";
import type { MeetingListItem } from "@/types/api";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/cn";
import { notifyLinkError } from "../lib/notifyLinkError";

export interface AttachPastMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** + altındaki halka — seçilen geçmiş toplantı bunun PARENT'ı olur */
  anchorMeetingId: number;
  /** Zincirde zaten bulunan kimlikler (seçilemez) */
  excludedMeetingIds: number[];
  onLinked?: () => void;
}

export function AttachPastMeetingModal({
  isOpen,
  onClose,
  anchorMeetingId,
  excludedMeetingIds,
  onLinked,
}: AttachPastMeetingModalProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [menuMeetingId, setMenuMeetingId] = useState<number | null>(null);
  const [chainPreview, setChainPreview] = useState<{
    meetingId: number;
    title: string;
    nodes: MeetingChainNode[];
  } | null>(null);
  const [chainLoadingId, setChainLoadingId] = useState<number | null>(null);
  const { mutateAsync: addLink } = useAddMeetingLink();
  const meetingsQuery = useMeetingsList({ pageSize: 1000 }, { enabled: isOpen });

  const excluded = useMemo(() => new Set(excludedMeetingIds), [excludedMeetingIds]);
  const candidates = useMemo(() => {
    const items = meetingsQuery.data?.items ?? [];
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return items
      .filter((item) => item.id !== anchorMeetingId && !excluded.has(item.id))
      .filter((item) => {
        if (!normalized) return true;
        return `${item.title} ${item.id} ${item.meetingDate}`.toLocaleLowerCase("tr-TR").includes(normalized);
      })
      .slice(0, 40);
  }, [meetingsQuery.data, excluded, anchorMeetingId, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedId(null);
      setMenuMeetingId(null);
      setChainPreview(null);
      setChainLoadingId(null);
    }
  }, [isOpen]);

  async function handleConfirm() {
    if (!selectedId || isLinking) return;
    setIsLinking(true);
    try {
      await addLink({
        meetingId: selectedId,
        dto: { childMeetingId: anchorMeetingId, relationType: "CONTINUATION" },
      });
      toast.success("Geçmiş toplantı zincire bağlandı.");
      onLinked?.();
      setSelectedId(null);
      setQuery("");
      onClose();
    } catch (error) {
      notifyLinkError(error);
    } finally {
      setIsLinking(false);
    }
  }

  function handleClose() {
    if (isLinking) return;
    setSelectedId(null);
    setQuery("");
    setMenuMeetingId(null);
    onClose();
  }

  async function openChainPreview(item: MeetingListItem) {
    setMenuMeetingId(null);
    setChainLoadingId(item.id);
    try {
      const nodes = await resolveMeetingChain(item.id);
      setChainPreview({
        meetingId: item.id,
        title: item.title,
        nodes: nodes.length > 0 ? nodes : [{
          id: item.id,
          title: item.title,
          meetingDate: item.meetingDate,
          participantCount: item.participantCount,
          noteCount: item.noteCount,
          links: [],
        }],
      });
    } catch (error) {
      console.error("[AttachPastMeetingModal] Chain preview error:", error);
      toast.error("Toplantı zinciri yüklenemedi.");
    } finally {
      setChainLoadingId(null);
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Geçmiş toplantıyı bağla"
        description="Seçilen toplantı, bu halkadan önceki oturum olarak zincire eklenir."
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLinking}>
              İptal
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              disabled={!selectedId || isLinking}
              onClick={() => void handleConfirm()}
            >
              Zincire bağla
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Başlık, tarih veya no ile ara…"
            icon={<Search className="h-4 w-4" />}
            autoFocus
          />
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-[16px] border border-surface-200 p-1 dark:border-surface-700">
            {meetingsQuery.isPending ? (
              <p className="flex items-center justify-center gap-2 py-8 text-sm text-surface-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Toplantılar yükleniyor…
              </p>
            ) : candidates.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-500">Uygun toplantı bulunamadı.</p>
            ) : (
              candidates.map((item) => {
                const active = selectedId === item.id;
                const inChain = (item.linkCount ?? 0) > 0;
                return (
                  <CandidateRow
                    key={item.id}
                    item={item}
                    active={active}
                    inChain={inChain}
                    menuOpen={menuMeetingId === item.id}
                    chainLoading={chainLoadingId === item.id}
                    onSelect={() => setSelectedId(item.id)}
                    onToggleMenu={() =>
                      setMenuMeetingId((current) => (current === item.id ? null : item.id))
                    }
                    onCloseMenu={() => setMenuMeetingId(null)}
                    onOpenChain={() => void openChainPreview(item)}
                  />
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={chainPreview != null}
        onClose={() => setChainPreview(null)}
        title="Toplantı Zinciri"
        description={
          chainPreview
            ? `“${chainPreview.title}” silsilesi · ${chainPreview.nodes.length} halka`
            : undefined
        }
        size="md"
      >
        {chainPreview && (
          <ol className="relative space-y-0 pl-1">
            {chainPreview.nodes.map((node, index) => {
              const isFocus = node.id === chainPreview.meetingId;
              const isLast = index === chainPreview.nodes.length - 1;
              return (
                <li key={node.id} className="relative flex gap-3">
                  <div className="flex w-8 shrink-0 flex-col items-center">
                    <span
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 rounded-full",
                        isFocus ? "bg-brand-600" : "bg-surface-300 dark:bg-surface-600",
                      )}
                      aria-hidden
                    />
                    {!isLast && <span className="mt-1 w-px flex-1 min-h-[1.75rem] bg-surface-200 dark:bg-surface-700" aria-hidden />}
                  </div>
                  <div className={cn("min-w-0 flex-1 pb-3", isLast && "pb-0")}>
                    <p className="text-[11px] text-surface-500">
                      {formatDate(node.meetingDate, "long")}
                      {isFocus ? " · Seçilen" : ""}
                    </p>
                    <p className={cn("truncate text-sm", isFocus ? "font-semibold text-brand-700 dark:text-brand-300" : "font-medium text-surface-900 dark:text-surface-50")}>
                      {node.title}
                    </p>
                    <p className="text-xs text-surface-500">
                      #{node.id} · {node.participantCount} katılımcı · {node.noteCount} not
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Modal>
    </>
  );
}

function CandidateRow({
  item,
  active,
  inChain,
  menuOpen,
  chainLoading,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onOpenChain,
}: {
  item: MeetingListItem;
  active: boolean;
  inChain: boolean;
  menuOpen: boolean;
  chainLoading: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpenChain: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseMenu();
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [menuOpen, onCloseMenu]);

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-2 rounded-[14px] px-3 py-2.5 transition-colors",
        active ? "bg-brand-600 text-white" : "hover:bg-surface-100 dark:hover:bg-surface-800",
      )}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{item.title}</span>
          {inChain && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                active
                  ? "bg-white/20 text-white"
                  : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300",
              )}
            >
              <GitBranch className="h-3 w-3" />
              Zincirde
            </span>
          )}
        </div>
        <span className={cn("text-xs", active ? "text-white/80" : "text-surface-500")}>
          {formatDate(item.meetingDate, "long")} · #{item.id} · {item.statusDisplay}
        </span>
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          aria-label="Toplantı menüsü"
          aria-expanded={menuOpen}
          disabled={chainLoading}
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu();
          }}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            active
              ? "text-white/80 hover:bg-white/15 hover:text-white"
              : "text-surface-400 hover:bg-surface-200 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-100",
            chainLoading && "opacity-60",
          )}
        >
          {chainLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-surface-200 bg-white py-1 shadow-elevated dark:border-surface-600 dark:bg-surface-900">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-800 hover:bg-surface-100 dark:text-surface-100 dark:hover:bg-surface-800"
              onClick={(event) => {
                event.stopPropagation();
                onOpenChain();
              }}
            >
              <GitBranch className="h-4 w-4 text-brand-600" />
              Toplantı Zinciri
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
