/**
 * EditNoteInline — inline note content editing.
 *
 * Renders a textarea with the current note content.
 * Save/Cancel buttons appear inline. Calls `onSave` with
 * the updated NoteUpdatePayload.
 */
import { type FormEvent, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import { Select } from "@/shared/ui/Select";
import type { Note, NoteUpdatePayload } from "@/entities/note/model";
import { NOTE_TYPE_OPTIONS } from "@/entities/note/constants";
import type { NoteType } from "@/shared/config/constants";

export interface EditNoteInlineProps {
  note: Note;
  onSave: (noteId: number, data: NoteUpdatePayload) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditNoteInline({
  note,
  onSave,
  onCancel,
  isLoading = false,
}: EditNoteInlineProps) {
  const [content, setContent] = useState(note.content);
  const [type, setType] = useState<NoteType>(note.type);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Not içeriği boş olamaz.");
      return;
    }

    setError("");
    const payload: NoteUpdatePayload = {};
    if (content.trim() !== note.content) payload.content = content.trim();
    if (type !== note.type) payload.type = type;

    await onSave(note.id, payload);
  }

  const typeOptions = NOTE_TYPE_OPTIONS.filter((o) => o.value !== "");

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-brand-200 bg-brand-50/30 p-3 animate-fade-in"
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={error}
            disabled={isLoading}
            rows={3}
            autoFocus
          />
        </div>
        <div className="w-full sm:w-32 shrink-0">
          <Select
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as NoteType)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          icon={<X className="h-3.5 w-3.5" />}
        >
          İptal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isLoading}
          icon={<Check className="h-3.5 w-3.5" />}
        >
          Kaydet
        </Button>
      </div>
    </form>
  );
}
