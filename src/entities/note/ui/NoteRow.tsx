import { useState, useEffect } from "react";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Input } from "@/shared/ui/Input";
import { cn } from "@/shared/lib/cn";
import type { Note, NoteUpdatePayload } from "../model";
import { NOTE_TYPE_OPTIONS } from "../constants";
import type { NoteType } from "@/shared/config/constants";
import { usePersonOptions } from "@/features/note/AddNoteForm";

export interface NoteRowProps {
  note: Note;
  editable?: boolean;
  onUpdate?: (data: Partial<NoteUpdatePayload>) => void;
  onEnter?: () => void;
  className?: string;
}

export function NoteRow({ note, editable = false, onUpdate, onEnter, className }: NoteRowProps) {
  const [content, setContent] = useState(note.content);
  const [type, setType] = useState<NoteType>(note.noteType);
  const [hasTermin, setHasTermin] = useState(Boolean(note.dueDate || note.responsiblePersonId));
  const [dueDate, setDueDate] = useState(note.dueDate || "");
  const [personId, setPersonId] = useState(note.responsiblePersonId ? String(note.responsiblePersonId) : "");

  const personOptions = usePersonOptions();
  const RESPONSIBLE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    ...personOptions.map(p => ({ value: String(p.value), label: p.label })),
  ];

  // Sync state if props change externally
  useEffect(() => {
    setContent(note.content);
    setType(note.noteType);
    setDueDate(note.dueDate || "");
    setPersonId(note.responsiblePersonId ? String(note.responsiblePersonId) : "");
    setHasTermin(Boolean(note.dueDate || note.responsiblePersonId));
  }, [note]);

  const handleBlur = () => {
    if (!editable || !onUpdate) return;
    if (content.trim() !== note.content) {
      onUpdate({ content: content.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur(); // Save current changes
      onEnter?.();
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType as NoteType);
    if (editable && onUpdate) onUpdate({ noteType: newType as NoteType });
  };

  const handleHasTerminChange = (checked: boolean) => {
    setHasTermin(checked);
    if (!checked && editable && onUpdate) {
      setDueDate("");
      setPersonId("");
      onUpdate({ dueDate: undefined, responsiblePersonId: undefined });
    }
  };

  const handleDateChange = (val: string) => {
    setDueDate(val);
    if (editable && onUpdate) onUpdate({ dueDate: val || undefined });
  };

  const handlePersonChange = (val: string) => {
    setPersonId(val);
    if (editable && onUpdate) {
      onUpdate({ responsiblePersonId: val ? Number(val) : undefined });
    }
  };

  return (
    <div className={cn("flex w-full items-start gap-2 text-sm", className)}>
      <div className="w-24 shrink-0 truncate text-xs text-surface-500 pt-1.5" title={note.createdByName}>
        {note.createdByName}
      </div>
      <div className="flex-1 min-w-[200px]">
        {editable ? (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm resize-none focus:outline-none min-h-[32px] overflow-hidden leading-relaxed"
            rows={1}
            placeholder="Karar / görev metni..."
          />
        ) : (
          <div className="p-1 whitespace-pre-wrap leading-relaxed">{content}</div>
        )}
      </div>
      <div className="w-24 shrink-0 text-center text-xs text-surface-400 font-mono pt-1.5">
        K-{note.id.toString().padStart(5, '0')}
      </div>
      <div className="w-28 shrink-0">
        {editable ? (
          <Select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            options={NOTE_TYPE_OPTIONS.filter(o => o.value !== "")}
            className="h-8 text-xs !py-1 !px-2 bg-transparent border-transparent hover:border-surface-200"
          />
        ) : (
          <div className="pt-1.5 text-surface-600">{NOTE_TYPE_OPTIONS.find(o => o.value === type)?.label || type}</div>
        )}
      </div>
      <div className="w-64 shrink-0 flex items-start gap-2">
        <label className="flex items-center gap-1.5 pt-2 cursor-pointer select-none">
          <Checkbox checked={hasTermin} onChange={handleHasTerminChange} disabled={!editable} />
          <span className="text-xs text-surface-600">Termin</span>
        </label>
        {hasTermin && (
          <div className="flex flex-col gap-1 flex-1">
            {editable ? (
              <>
                <Input type="date" value={dueDate} onChange={(e) => handleDateChange(e.target.value)} className="h-8 text-xs !py-1 !px-2" />
                <Select options={RESPONSIBLE_OPTIONS} value={personId} onChange={(e) => handlePersonChange(e.target.value)} className="h-8 text-xs !py-1 !px-2" />
              </>
            ) : (
              <div className="pt-1 text-xs text-surface-600 flex flex-col gap-1">
                {dueDate && <span>{new Date(dueDate).toLocaleDateString('tr-TR')}</span>}
                {note.responsiblePersonName && <span className="truncate" title={note.responsiblePersonName}>{note.responsiblePersonName}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
