import React from "react";
/**
 * AddNoteForm — add a new note/minute to a meeting.
 *
 * Collects content (textarea), type (select), and optionally:
 * termin (deadline date), sorumlu (responsible person), durum (status).
 */
import { type FormEvent, useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Input } from "@/shared/ui/Input";
import { NOTE_TYPE_OPTIONS } from "@/entities/note/constants";
import type { NoteCreatePayload } from "@/entities/note/model";
import type { NoteType, ActionStatus } from "@/shared/config/constants";
import { fetchPersons } from "@/services/catalogService";
import type { PersonDto } from "@/types/api";
import { cn } from "@/shared/lib/cn";


// RESPONSIBLE_OPTIONS is now computed inside the component using personOptions hook

export interface AddNoteFormProps {
  meetingId: number;
  onSubmit: (data: NoteCreatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function usePersonOptions() {
  const [personOptions, setPersonOptions] = React.useState<{value: number; label: string}[]>([]);
  React.useEffect(() => {
    fetchPersons().then(data => {
      setPersonOptions(data.filter(p => p.isActive).map((p: PersonDto) => ({ value: p.id, label: p.fullName })));
    }).catch(console.error);
  }, []);
  return personOptions;
}

export function AddNoteForm({
  meetingId: _meetingId,
  onSubmit,
  onCancel,
  isLoading = false,
}: AddNoteFormProps) {
  const personOptions = usePersonOptions();
  const RESPONSIBLE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    ...personOptions.map(p => ({ value: String(p.value), label: p.label })),
  ];
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("NOTE");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Not içeriği boş olamaz.");
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
    // Refocus textarea for next note
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  // Filter out the empty "Tüm Tipler" option
  const typeOptions = NOTE_TYPE_OPTIONS.filter((o) => o.value !== "");

  return (
    <div className="flex w-full items-start gap-2 text-sm py-2 px-3 bg-surface-50 dark:bg-surface-800/30 border-b border-surface-200 dark:border-surface-700/50 last:border-0">
      <div className="w-6 shrink-0" />
      <div className="w-24 shrink-0" />
      <div className="flex-1 min-w-[200px]">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          className={cn(
            "w-full bg-white dark:bg-surface-900 border rounded focus:ring-1 p-1 text-sm resize-none focus:outline-none min-h-[32px] overflow-hidden leading-relaxed",
            error ? "border-danger-500 focus:ring-danger-500" : "border-surface-200 focus:border-brand-500 focus:ring-brand-500"
          )}
          rows={1}
          placeholder="Karar / görev metni... (Kaydetmek için Enter'a basın)"
          autoFocus
        />
        {error && <div className="text-danger-500 text-xs mt-1">{error}</div>}
      </div>
      <div className="w-24 shrink-0 text-center text-xs text-surface-400 font-mono pt-1.5">
        —
      </div>
      <div className="w-28 shrink-0">
        <Select
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          disabled={isLoading}
          className="h-8 text-xs !py-1 !px-2 bg-white dark:bg-surface-900"
        />
      </div>
      <div className="w-64 shrink-0 flex items-start gap-2">
        <label className="flex items-center gap-1.5 pt-2 cursor-pointer select-none">
          <Checkbox
            checked={hasDeadline}
            onChange={(c) => { setHasDeadline(c); if (!c) { setDeadline(""); setResponsibleId(""); } }}
            disabled={isLoading}
          />
          <span className="text-xs text-surface-600">Termin</span>
        </label>
        {hasDeadline && (
          <div className="flex flex-col gap-1 flex-1">
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isLoading}
              className="h-8 text-xs !py-1 !px-2"
            />
            <Select
              options={RESPONSIBLE_OPTIONS}
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              disabled={isLoading}
              className="h-8 text-xs !py-1 !px-2"
            />
          </div>
        )}
      </div>
      <div className="w-auto shrink-0 flex justify-end gap-1 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="!p-1 text-surface-400 hover:text-surface-600">
            Kapat
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={(e) => handleSubmit(e as any)} className="!p-1 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
