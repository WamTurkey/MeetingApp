import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  FolderInput,
  Inbox,
  ListChecks,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePersons } from "@/entities/catalog/api/queries";
import { useFollowups, useUpdateFollowup } from "@/entities/followup/api/queries";
import { useReminderLists } from "@/entities/reminder-list/api/queries";
import { FollowupDetailModal } from "@/features/followup/FollowupDetailModal";
import { AttachToListModal } from "@/features/reminders/AttachToListModal";
import { CreateReminderListModal } from "@/features/reminders/CreateReminderListModal";
import { CreateReminderModal } from "@/features/reminders/CreateReminderModal";
import { isFollowupClosed, toUpdateFollowupRequest } from "@/shared/lib/followupPayload";
import { reminderListIcon } from "@/shared/lib/reminderAppearance";
import { toIstanbulDateKey, formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/cn";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import type { FollowupItem } from "@/entities/followup/model";
import type { ActionStatus } from "@/shared/config/constants";
import type { FollowupItemDto } from "@/types/api";
import { toast } from "sonner";

const LONG_PRESS_MS = 450;

type SmartKey = "today" | "scheduled" | "all" | "flagged" | "urgent" | "done";
type View =
  | { kind: "home" }
  | { kind: "smart"; key: SmartKey }
  | { kind: "mine" }
  | { kind: "list"; listId: number };

interface RemindersDashboardProps {
  onBack: () => void;
}

function toFollowup(dto: FollowupItemDto): FollowupItem {
  return {
    id: dto.id,
    text: dto.text,
    topicId: dto.topicId,
    responsiblePersonId: dto.responsiblePersonId,
    responsiblePersonName: dto.responsiblePersonName ?? undefined,
    responsibleCompanyId: dto.responsibleCompanyId,
    responsibleCompanyName: dto.responsibleCompanyName ?? undefined,
    dueDate: dto.dueDate,
    actionStatus: dto.actionStatus as ActionStatus,
    actionStatusDisplay: dto.actionStatusDisplay,
    waitingReason: dto.waitingReason ?? "",
    dependencyItemIds: dto.dependencyItemIds ?? [],
    completedOn: dto.completedOn,
    developmentNote: dto.developmentNote ?? undefined,
    version: dto.version,
    sourceMeetingId: dto.sourceMeetingId ?? undefined,
    sourceMeetingTitle: dto.sourceMeetingTitle ?? undefined,
    listId: dto.listId,
    listName: dto.listName,
    isFlagged: dto.isFlagged,
    isUrgent: dto.isUrgent,
    linkedFollowupId: dto.linkedFollowupId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function RemindersDashboard({ onBack }: RemindersDashboardProps) {
  const { user } = useAuth();
  const today = toIstanbulDateKey();
  const followups = useFollowups().data ?? [];
  const lists = useReminderLists().data ?? [];
  const persons = usePersons().data ?? [];
  const updateFollowup = useUpdateFollowup();
  const linkedPerson = persons.find((person) => person.linkedUserId === user?.id);
  const [view, setView] = useState<View>({ kind: "home" });
  const [showCreateList, setShowCreateList] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [menuItem, setMenuItem] = useState<FollowupItemDto | null>(null);
  const [moveItem, setMoveItem] = useState<FollowupItemDto | null>(null);
  const [editingItem, setEditingItem] = useState<FollowupItemDto | null>(null);
  const [moveListId, setMoveListId] = useState<string>("");
  const suppressClickRef = useRef(false);

  const smartCounts = useMemo(() => ({
    today: followups.filter((item) => item.dueDate?.slice(0, 10) === today && !isFollowupClosed(item.actionStatus)).length,
    scheduled: followups.filter((item) => item.dueDate && !isFollowupClosed(item.actionStatus)).length,
    all: followups.filter((item) => item.actionStatus !== "CANCELLED").length,
    flagged: followups.filter((item) => item.isFlagged && item.actionStatus !== "CANCELLED").length,
    urgent: followups.filter((item) => item.isUrgent && !isFollowupClosed(item.actionStatus)).length,
    done: followups.filter((item) => item.actionStatus === "DONE").length,
  }), [followups, today]);

  const mineItems = useMemo(
    () => (linkedPerson ? followups.filter((item) => item.responsiblePersonId === linkedPerson.id) : []),
    [followups, linkedPerson],
  );

  const visibleItems = useMemo(() => {
    if (view.kind === "mine") return mineItems;
    if (view.kind === "list") return followups.filter((item) => item.listId === view.listId);
    if (view.kind !== "smart") return [];
    if (view.key === "today") return followups.filter((item) => item.dueDate?.slice(0, 10) === today && !isFollowupClosed(item.actionStatus));
    if (view.key === "scheduled") return followups.filter((item) => item.dueDate && !isFollowupClosed(item.actionStatus));
    if (view.key === "all") return followups.filter((item) => item.actionStatus !== "CANCELLED");
    if (view.key === "flagged") return followups.filter((item) => item.isFlagged && item.actionStatus !== "CANCELLED");
    if (view.key === "urgent") return followups.filter((item) => item.isUrgent && !isFollowupClosed(item.actionStatus));
    return followups.filter((item) => item.actionStatus === "DONE");
  }, [followups, mineItems, today, view]);

  const selectedItem = useMemo(() => {
    const dto = selectedId == null ? null : followups.find((item) => item.id === selectedId) ?? null;
    return dto ? toFollowup(dto) : null;
  }, [followups, selectedId]);

  const cards = [
    { key: "today" as const, label: "Bugün", count: smartCounts.today, color: "#0A84FF", icon: CalendarDays },
    { key: "scheduled" as const, label: "Zamanlanmış", count: smartCounts.scheduled, color: "#FF453A", icon: CalendarDays },
    { key: "all" as const, label: "Tümü", count: smartCounts.all, color: "#1C1C1E", icon: Inbox },
    { key: "flagged" as const, label: "Yüksek", count: smartCounts.flagged, color: "#FF9F0A", icon: Flag },
    { key: "urgent" as const, label: "Acil", count: smartCounts.urgent, color: "#FF375F", icon: AlarmClock },
    { key: "done" as const, label: "Tamamlanmış", count: smartCounts.done, color: "#8E8E93", icon: Check },
  ];

  const title = view.kind === "home"
    ? "Listelerim"
      : view.kind === "mine"
      ? "Terminler"
      : view.kind === "list"
        ? lists.find((list) => list.id === view.listId)?.name ?? "Liste"
        : cards.find((card) => card.key === view.key)?.label ?? "Liste";

  async function toggleDone(item: FollowupItemDto) {
    const nextStatus = item.actionStatus === "DONE" ? "OPEN" : "DONE";
    try {
      await updateFollowup.mutateAsync({
        id: item.id,
        request: toUpdateFollowupRequest(item, {
          actionStatus: nextStatus,
          completedOn: nextStatus === "DONE" ? today : "",
        }),
      });
    } catch {
      toast.error("Durum güncellenemedi");
    }
  }

  async function handleDetailUpdate(id: number, updates: Partial<FollowupItem>): Promise<boolean> {
    const current = followups.find((item) => item.id === id);
    if (!current) return false;
    try {
      await updateFollowup.mutateAsync({
        id,
        request: toUpdateFollowupRequest(current, {
          text: updates.text,
          topicId: updates.topicId ?? undefined,
          responsiblePersonId: updates.responsiblePersonId ?? undefined,
          responsibleCompanyId: updates.responsibleCompanyId ?? undefined,
          dueDate: updates.dueDate ?? undefined,
          actionStatus: updates.actionStatus,
          completedOn: updates.completedOn ?? undefined,
          waitingReason: updates.waitingReason,
          developmentNote: updates.developmentNote,
          dependencyItemIds: updates.dependencyItemIds,
          listId: updates.listId ?? undefined,
          isFlagged: updates.isFlagged,
          isUrgent: updates.isUrgent,
        }),
      });
      return true;
    } catch {
      toast.error("Güncelleme başarısız");
      return false;
    }
  }

  async function addFlag(item: FollowupItemDto) {
    try {
      await updateFollowup.mutateAsync({
        id: item.id,
        request: toUpdateFollowupRequest(item, { isFlagged: true, isUrgent: false }),
      });
      toast.success("Bayrak eklendi (Yüksek öncelik)");
    } catch {
      toast.error("Bayrak eklenemedi");
    }
  }

  async function moveToList() {
    if (!moveItem || !moveListId) {
      toast.error("Hedef liste seçin");
      return;
    }
    try {
      await updateFollowup.mutateAsync({
        id: moveItem.id,
        request: toUpdateFollowupRequest(moveItem, { listId: Number(moveListId) }),
      });
      toast.success("Listeye taşındı");
      setMoveItem(null);
      setMoveListId("");
    } catch {
      toast.error("Taşıma başarısız");
    }
  }

  function openRow(item: FollowupItemDto) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedId(item.id);
  }

  return (
    <div className="relative min-h-[70vh] pb-20">
      <div className="mb-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white dark:bg-blue-400 dark:text-slate-950"
        >
          <ListChecks className="h-4 w-4" />
          Terminler
        </button>
        {view.kind === "home" && (
          <button
            type="button"
            onClick={() => setShowCreateList(true)}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-400"
          >
            <Plus className="h-4 w-4" />
            Liste Oluştur
          </button>
        )}
      </div>

      {view.kind !== "home" && (
        <button
          type="button"
          onClick={() => setView({ kind: "home" })}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400"
        >
          <ChevronLeft className="h-4 w-4" />
          Listeler
        </button>
      )}

      {view.kind === "home" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => {
              const Glyph = card.icon;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setView({ kind: "smart", key: card.key })}
                  className="flex min-h-[5.5rem] flex-col justify-between rounded-[22px] p-3 text-left text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                  style={{ backgroundColor: card.color }}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                      <Glyph className="h-4 w-4" />
                    </span>
                    <span className="text-2xl font-semibold">{card.count}</span>
                  </span>
                  <span className="text-sm font-medium">{card.label}</span>
                </button>
              );
            })}
          </div>

          <h2 className="mb-2 mt-6 text-lg font-semibold text-shell-fg">Listelerim</h2>
          <div className="overflow-hidden rounded-[22px] bg-white/5">
            <button
              type="button"
              onClick={() => setView({ kind: "mine" })}
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#AF52DE] text-white">
                <ListChecks className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-shell-fg">Terminler</span>
                {!linkedPerson && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <TriangleAlert className="h-3 w-3" />
                    Kişi hesabı bağlı değil
                  </span>
                )}
              </span>
              <span className="text-sm text-shell-muted">{mineItems.length}</span>
              <ChevronRight className="h-4 w-4 text-shell-muted" />
            </button>
            {lists.map((list) => {
              const Glyph = reminderListIcon(list.icon);
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setView({ kind: "list", listId: list.id })}
                  className="flex w-full items-center gap-3 border-t border-white/5 px-3 py-3 text-left"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: list.color }}>
                    <Glyph className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-shell-fg">{list.name}</span>
                  <span className="text-sm text-shell-muted">{list.itemCount}</span>
                  <ChevronRight className="h-4 w-4 text-shell-muted" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <section>
          <h2 className="mb-3 text-2xl font-bold text-shell-fg">{title}</h2>
          {view.kind === "mine" && !linkedPerson ? (
            <p className="rounded-2xl bg-white/5 px-4 py-6 text-sm text-shell-muted">
              Terminler için katalogdaki kişi kaydınızın sistem kullanıcınıza bağlı olması gerekir.
            </p>
          ) : visibleItems.length === 0 ? (
            <p className="rounded-2xl bg-white/5 px-4 py-6 text-sm text-shell-muted">
              {view.kind === "list"
                ? "Bu listede madde yok. Mevcut terminlerinizden bağlayın."
                : "Bu görünümde madde yok."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-[22px] bg-white/5">
              {visibleItems.map((item, index) => (
                <ReminderRow
                  key={item.id}
                  item={item}
                  showDivider={index > 0}
                  onToggleDone={() => void toggleDone(item)}
                  onOpen={() => openRow(item)}
                  onLongPress={() => {
                    suppressClickRef.current = true;
                    setMenuItem(item);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setShowAttach(true)}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] lg:bottom-8"
        aria-label="Listeye bağla"
      >
        <Plus className="h-7 w-7" />
      </button>

      <CreateReminderListModal
        isOpen={showCreateList}
        onClose={() => setShowCreateList(false)}
        onCreated={(listId) => setView({ kind: "list", listId })}
      />
      <AttachToListModal
        isOpen={showAttach}
        onClose={() => setShowAttach(false)}
        targetListId={view.kind === "list" ? view.listId : null}
      />
      <FollowupDetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedId(null)}
        item={selectedItem}
        onUpdate={handleDetailUpdate}
      />

      <CreateReminderModal
        isOpen={editingItem != null}
        onClose={() => setEditingItem(null)}
        editingItem={editingItem}
      />

      <Modal
        isOpen={menuItem != null}
        onClose={() => setMenuItem(null)}
        title="Anımsatıcı işlemleri"
        size="sm"
        showClose={false}
      >
        <div className="space-y-1">
          <p className="mb-3 line-clamp-2 text-sm text-shell-muted">{menuItem?.text}</p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-shell-fg hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => {
              if (!menuItem) return;
              setMoveListId(menuItem.listId != null ? String(menuItem.listId) : "");
              setMoveItem(menuItem);
              setMenuItem(null);
            }}
          >
            <FolderInput className="h-4 w-4 text-blue-400" />
            Başka bir listeye taşı
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-shell-fg hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => {
              if (!menuItem) return;
              const target = menuItem;
              setMenuItem(null);
              void addFlag(target);
            }}
          >
            <Flag className="h-4 w-4 text-amber-400" />
            Bayrak ekle
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-shell-fg hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => {
              if (!menuItem) return;
              setEditingItem(menuItem);
              setMenuItem(null);
            }}
          >
            <Pencil className="h-4 w-4 text-shell-muted" />
            Anımsatıcıyı düzenle
          </button>
          <Button type="button" variant="secondary" className="mt-2 w-full" onClick={() => setMenuItem(null)}>
            Vazgeç
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={moveItem != null}
        onClose={() => {
          setMoveItem(null);
          setMoveListId("");
        }}
        title="Listeye taşı"
        size="sm"
      >
        <div className="space-y-4">
          <p className="line-clamp-2 text-sm text-shell-muted">{moveItem?.text}</p>
          {lists.length === 0 ? (
            <p className="text-sm text-shell-muted">Taşınacak liste yok. Önce bir liste oluşturun.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setMoveListId(String(list.id))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    moveListId === String(list.id)
                      ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
                      : "bg-black/5 text-shell-fg dark:bg-white/10",
                  )}
                >
                  {list.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMoveItem(null);
                setMoveListId("");
              }}
            >
              İptal
            </Button>
            <Button type="button" variant="primary" disabled={!moveListId} onClick={() => void moveToList()}>
              Taşı
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReminderRow({
  item,
  showDivider,
  onToggleDone,
  onOpen,
  onLongPress,
}: {
  item: FollowupItemDto;
  showDivider: boolean;
  onToggleDone: () => void;
  onOpen: () => void;
  onLongPress: () => void;
}) {
  const timerRef = useRef<number | null>(null);
  const pressedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startPress() {
    pressedRef.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      pressedRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function endPress() {
    clearTimer();
  }

  useEffect(() => () => clearTimer(), []);

  return (
    <div
      className={cn("flex items-center gap-3 px-3 py-3 select-none", showDivider && "border-t border-white/5")}
      onContextMenu={(event) => {
        event.preventDefault();
        onLongPress();
      }}
    >
      <button
        type="button"
        onClick={onToggleDone}
        aria-pressed={item.actionStatus === "DONE"}
        className={cn(
          "h-5 w-5 shrink-0 rounded-full border-2",
          item.actionStatus === "DONE" ? "border-blue-500 bg-blue-500" : "border-white/35 bg-transparent",
        )}
        aria-label={`${item.text} tamamla`}
      />
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onClick={() => {
          if (pressedRef.current) {
            pressedRef.current = false;
            return;
          }
          onOpen();
        }}
      >
        <span className={cn("block truncate text-sm", item.actionStatus === "DONE" ? "text-shell-muted line-through" : "text-shell-fg")}>
          {item.text}
        </span>
        <span className="mt-0.5 block text-xs text-shell-muted">
          {[item.dueDate ? formatDate(item.dueDate, "short") : null, item.responsiblePersonName, item.listName]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </button>
    </div>
  );
}
