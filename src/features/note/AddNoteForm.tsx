/**
 * AddNoteForm — add a new note/minute to a meeting.
 *
 * Collects content (textarea), type (select), and optionally:
 * termin (deadline date), sorumlu (responsible person), durum (status).
 */
import { type FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Input } from "@/shared/ui/Input";
import { NOTE_TYPE_OPTIONS } from "@/entities/note/constants";
import type { NoteCreatePayload } from "@/entities/note/model";
import type { NoteType, ActionStatus } from "@/shared/config/constants";
import { MOCK_PEOPLE } from "@/entities/person/mock";

const STATUS_OPTIONS = [
  { value: "", label: "Seçilmedi" },
  { value: "OPEN", label: "Açık" },
  { value: "IN_PROGRESS", label: "Sürüyor" },
  { value: "DONE", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
];

const RESPONSIBLE_OPTIONS = [
  { value: "", label: "Seçilmedi" },
  ...MOCK_PEOPLE.filter((p) => p.isActive).map((p) => ({
    value: p.id.toString(),
    label: p.fullName,
  })),
];

export interface AddNoteFormProps {
  meetingId: number;
  onSubmit: (data: NoteCreatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function AddNoteForm({
  meetingId: _meetingId,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("NOTE");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Not içeriği boş olamaz.");
      return;
    }
    if (content.trim().length < 5) {
      setError("Not içeriği en az 5 karakter olmalıdır.");
      return;
    }

    setError("");
    await onSubmit({
      
      content: content.trim(),
      noteType: type,
      dueDate: hasDeadline && deadline ? deadline : undefined,
      responsiblePersonId: responsibleId ? Number(responsibleId) : undefined,
      actionStatus: status ? (status as ActionStatus) : undefined,
    });

    // Reset form on success
    setContent("");
    setType("NOTE");
    setHasDeadline(false);
    setDeadline("");
    setResponsibleId("");
    setStatus("");
  }

  // Filter out the empty "Tüm Tipler" option
  const typeOptions = NOTE_TYPE_OPTIONS.filter((o) => o.value !== "");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      {/* Row 1: Textarea + Tip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Textarea
            placeholder="Yeni not, karar veya görev ekleyin..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={error}
            disabled={isLoading}
            rows={3}
          />
        </div>
        <div className="w-full sm:w-36 shrink-0">
          <Select
            label="Tip"
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as NoteType)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Row 2: Termin / Sorumlu / Durum — horizontal strip */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-50/50 px-3 py-2.5 dark:bg-surface-800/50">
        {/* Termin */}
        <div className="flex items-center gap-2">
          <Checkbox
            label="Termin"
            checked={hasDeadline}
            onChange={(c) => { setHasDeadline(c); if (!c) setDeadline(""); }}
            disabled={isLoading}
          />
          {hasDeadline && (
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isLoading}
              className="!py-1 !text-xs w-36"
            />
          )}
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-6 w-px bg-surface-200 dark:bg-surface-600" />

        {/* Sorumlu */}
        <div className="w-full sm:w-44">
          <Select
            label="Sorumlu"
            options={RESPONSIBLE_OPTIONS}
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-6 w-px bg-surface-200 dark:bg-surface-600" />

        {/* Durum */}
        <div className="w-full sm:w-36">
          <Select
            label="Durum"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            İptal
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isLoading}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Not Ekle
        </Button>
      </div>
    </form>
  );
}
