import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePersons } from "@/entities/catalog/api/queries";
import { useFollowups } from "@/entities/followup/api/queries";
import { useReminderLists } from "@/entities/reminder-list/api/queries";
import { CreateReminderModal, type ReminderFormSeed } from "@/features/reminders/CreateReminderModal";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/cn";
import { Modal } from "@/shared/ui/Modal";
import { SearchBar } from "@/shared/ui/SearchBar";
import { toast } from "sonner";
import type { FollowupItemDto } from "@/types/api";

type PickerFilter = "mine" | "meeting" | "personal" | "all";

const FILTERS: { key: PickerFilter; label: string }[] = [
  { key: "mine", label: "Görevlerim" },
  { key: "meeting", label: "Toplantı terminleri" },
  { key: "personal", label: "Kişisel" },
  { key: "all", label: "Tümü" },
];

interface AttachToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListId?: number | null;
}

export function AttachToListModal({ isOpen, onClose, targetListId }: AttachToListModalProps) {
  const { user } = useAuth();
  const followups = useFollowups().data ?? [];
  const lists = useReminderLists().data ?? [];
  const persons = usePersons().data ?? [];
  const linkedPerson = persons.find((person) => person.linkedUserId === user?.id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PickerFilter>("mine");
  const [selectedListId, setSelectedListId] = useState<number | null>(targetListId ?? null);
  const [formSeed, setFormSeed] = useState<ReminderFormSeed | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setFilter("mine");
    setSelectedListId(targetListId ?? null);
    setFormSeed(null);
    setShowForm(false);
  }, [isOpen, targetListId]);

  const resolvedListId = targetListId ?? selectedListId;
  const targetList = lists.find((list) => list.id === resolvedListId) ?? null;

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return followups.filter((item) => {
      if (item.actionStatus === "CANCELLED") return false;
      if (filter === "mine") {
        if (!linkedPerson) return false;
        if (item.responsiblePersonId !== linkedPerson.id) return false;
      } else if (filter === "meeting") {
        if (item.sourceMeetingId == null) return false;
      } else if (filter === "personal") {
        if (item.sourceMeetingId != null) return false;
      }
      if (!needle) return true;
      const haystack = [
        item.text,
        item.sourceMeetingTitle ?? "",
        item.responsiblePersonName ?? "",
        item.listName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, followups, linkedPerson, search]);

  function openCreateForm(item: FollowupItemDto) {
    if (!resolvedListId) {
      toast.error("Önce bir liste seçin");
      return;
    }
    setFormSeed({
      title: item.text,
      linkedFollowupId: item.id,
      listId: resolvedListId,
      // Tarih/not/öncelik kullanıcıya bırakılır
    });
    setShowForm(true);
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !showForm}
        onClose={onClose}
        size="lg"
        showClose={false}
        className="h-[min(88dvh,100%)] md:h-[min(80vh,40rem)]"
      >
        <div className="-mx-6 -mt-4 flex min-h-full flex-col gap-4 px-1">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-shell-muted hover:bg-white/10" aria-label="Kapat">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold text-shell-fg">Anımsatıcı kaynağı seç</h2>
            <span className="w-8" />
          </div>

          {targetListId == null && (
            <div className="space-y-2">
              {lists.length === 0 ? (
                <p className="rounded-2xl bg-black/5 px-3 py-3 text-sm text-shell-muted dark:bg-white/5">
                  Önce liste oluşturun.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => setSelectedListId(list.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        selectedListId === list.id
                          ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
                          : "bg-black/5 text-shell-fg dark:bg-white/10",
                      )}
                    >
                      {list.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {targetList && (
            <p className="text-xs text-shell-muted">
              Hedef liste: <span className="font-semibold text-shell-fg">{targetList.name}</span>
            </p>
          )}

          <SearchBar value={search} onChange={setSearch} placeholder="Termin, toplantı veya sorumlu ara…" size="sm" />

          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                  filter === tab.key
                    ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950"
                    : "bg-black/5 text-shell-muted dark:bg-white/10",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filter === "mine" && !linkedPerson && (
            <p className="rounded-2xl bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Görevlerim için katalogdaki kişi kaydınızın sistem kullanıcınıza bağlı olması gerekir.
            </p>
          )}

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {lists.length === 0 && targetListId == null ? (
              <p className="px-1 py-8 text-center text-sm text-shell-muted">Liste yok; oluşturma kapalı.</p>
            ) : visibleItems.length === 0 ? (
              <p className="px-1 py-8 text-center text-sm text-shell-muted">Bu filtrede eklenecek madde yok.</p>
            ) : (
              visibleItems.map((item) => {
                const alreadyLinked = resolvedListId != null && item.listId === resolvedListId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!resolvedListId}
                    onClick={() => openCreateForm(item)}
                    className={cn(
                      "flex w-full min-w-0 items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left",
                      "bg-black/5 hover:bg-black/10 disabled:opacity-50 dark:bg-white/5 dark:hover:bg-white/10",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-shell-fg">{item.text}</span>
                      <span className="mt-0.5 block truncate text-xs text-shell-muted">
                        {[
                          item.sourceMeetingId ? item.sourceMeetingTitle ?? "Toplantı termini" : "Kişisel",
                          item.dueDate ? formatDate(item.dueDate, "short") : null,
                          item.responsiblePersonName,
                          item.listName && item.listId !== resolvedListId ? item.listName : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {alreadyLinked && (
                      <span className="shrink-0 rounded-full bg-blue-600/20 px-2 py-0.5 text-2xs font-semibold text-blue-300">
                        Listede de var
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <CreateReminderModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setFormSeed(null);
        }}
        seed={formSeed}
        defaultListId={resolvedListId}
        onSaved={() => {
          setShowForm(false);
          setFormSeed(null);
          onClose();
        }}
      />
    </>
  );
}
