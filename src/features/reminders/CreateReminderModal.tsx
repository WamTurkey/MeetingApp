import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Select } from "@/shared/ui/Select";
import { useCreateFollowup, useFollowups, useUpdateFollowup } from "@/entities/followup/api/queries";
import { useReminderLists } from "@/entities/reminder-list/api/queries";
import {
  FOLLOWUP_PRIORITY,
  FOLLOWUP_PRIORITY_OPTIONS,
  getFollowupPriority,
  priorityToFlags,
  type FollowupPriority,
} from "@/shared/config/constants";
import { toUpdateFollowupRequest } from "@/shared/lib/followupPayload";
import { toast } from "sonner";
import type { FollowupItemDto } from "@/types/api";

export interface ReminderFormSeed {
  title?: string;
  note?: string;
  dueDate?: string | null;
  listId?: number | null;
  linkedFollowupId?: number | null;
  priority?: FollowupPriority;
}

export interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultListId?: number | null;
  defaultDueDate?: string;
  /** Görev/termin seçiminden gelen ön doldurma */
  seed?: ReminderFormSeed | null;
  /** Düzenleme modu — mevcut anımsatıcı */
  editingItem?: FollowupItemDto | null;
  onSaved?: () => void;
}

export function CreateReminderModal({
  isOpen,
  onClose,
  defaultListId,
  defaultDueDate,
  seed = null,
  editingItem = null,
  onSaved,
}: CreateReminderModalProps) {
  const createFollowup = useCreateFollowup();
  const updateFollowup = useUpdateFollowup();
  const lists = useReminderLists().data ?? [];
  const followups = useFollowups().data ?? [];
  const isEditing = editingItem != null;

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [listId, setListId] = useState("");
  const [linkedFollowupId, setLinkedFollowupId] = useState("");
  const [priority, setPriority] = useState<FollowupPriority>(FOLLOWUP_PRIORITY.NORMAL);

  const terminOptions = useMemo(
    () =>
      followups
        .filter((item) => {
          if (item.actionStatus === "CANCELLED") return false;
          if (editingItem && item.id === editingItem.id) return false;
          if (item.linkedFollowupId != null && item.id !== editingItem?.linkedFollowupId) return false;
          return true;
        })
        .map((item) => {
          const titleText = item.text.length > 56 ? `${item.text.slice(0, 56)}…` : item.text;
          const when = item.dueDate ? item.dueDate.slice(0, 10) : null;
          return { value: String(item.id), label: [titleText, when].filter(Boolean).join(" · ") };
        }),
    [followups, editingItem],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setTitle(editingItem.text ?? "");
      setNote(editingItem.developmentNote ?? "");
      setDueDate(editingItem.dueDate?.slice(0, 10) ?? "");
      setListId(editingItem.listId != null ? String(editingItem.listId) : "");
      setLinkedFollowupId(editingItem.linkedFollowupId != null ? String(editingItem.linkedFollowupId) : "");
      setPriority(getFollowupPriority(editingItem));
      return;
    }

    setTitle(seed?.title ?? "");
    setNote(seed?.note ?? "");
    setDueDate(seed?.dueDate?.slice(0, 10) ?? defaultDueDate ?? "");
    setListId(
      seed?.listId != null
        ? String(seed.listId)
        : defaultListId != null
          ? String(defaultListId)
          : "",
    );
    setLinkedFollowupId(seed?.linkedFollowupId != null ? String(seed.linkedFollowupId) : "");
    setPriority(seed?.priority ?? FOLLOWUP_PRIORITY.NORMAL);
  }, [isOpen, editingItem, seed, defaultListId, defaultDueDate]);

  const isSaving = createFollowup.isPending || updateFollowup.isPending;

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Başlık yazın");
      return;
    }

    const flags = priorityToFlags(priority);
    const nextListId = listId ? Number(listId) : undefined;
    const nextLinkedId = linkedFollowupId ? Number(linkedFollowupId) : undefined;

    try {
      if (editingItem) {
        await updateFollowup.mutateAsync({
          id: editingItem.id,
          request: toUpdateFollowupRequest(editingItem, {
            text: title.trim(),
            developmentNote: note.trim() || undefined,
            dueDate: dueDate || "",
            listId: nextListId ?? null,
            linkedFollowupId: nextLinkedId ?? null,
            isFlagged: flags.isFlagged,
            isUrgent: flags.isUrgent,
          }),
        });
        toast.success("Anımsatıcı güncellendi");
      } else {
        await createFollowup.mutateAsync({
          text: title.trim(),
          developmentNote: note.trim() || undefined,
          dueDate: dueDate || undefined,
          listId: nextListId,
          linkedFollowupId: nextLinkedId,
          actionStatus: "OPEN",
          ...flags,
        });
        toast.success("Anımsatıcı eklendi");
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error(isEditing ? "Anımsatıcı güncellenemedi" : "Anımsatıcı eklenemedi");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showClose={false}>
      <div className="-mx-6 -mt-4 space-y-5 px-1">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-shell-muted hover:bg-white/10" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-shell-fg">
            {isEditing ? "Anımsatıcıyı düzenle" : "Anımsatıcı oluştur"}
          </h2>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-full p-1.5 text-blue-500 hover:bg-white/10 disabled:opacity-40"
            aria-label="Kaydet"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 rounded-2xl bg-black/5 p-3 dark:bg-white/5">
          <Input
            label="Anımsatıcı adı"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Başlık"
          />
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notlar" rows={3} />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-muted">Tarih ve liste</p>
          <Input type="date" label="Tarih" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          <Select
            label="Liste"
            value={listId}
            onChange={(event) => setListId(event.target.value)}
            options={[{ value: "", label: "Listesiz" }, ...lists.map((list) => ({ value: String(list.id), label: list.name }))]}
          />
          <Select
            label="Termin bağlantısı"
            value={linkedFollowupId}
            onChange={(event) => setLinkedFollowupId(event.target.value)}
            options={[{ value: "", label: "Bağlantısız" }, ...terminOptions]}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-muted">Ayrıntılar</p>
          <Select
            label="Öncelik"
            value={priority}
            onChange={(event) => setPriority(event.target.value as FollowupPriority)}
            options={FOLLOWUP_PRIORITY_OPTIONS}
          />
        </div>
      </div>
    </Modal>
  );
}
