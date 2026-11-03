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

  // Sunucu/önbellek değeri değişince yerel state'i eşitle.
  // Nesne kimliğine değil ALAN değerlerine bağlıdır: başka bir satırın kaydı tamamlanıp liste
  // yenilendiğinde bu satırda yazılmakta olan metin ezilmez. Hata anında yapılan geri alma
  // (rollback) alan değerini değiştirdiği için yerel state de otomatik geri döner.
  useEffect(() => {
    setContent(note.content);
    setType(note.noteType);
    setDueDate(note.dueDate || "");
    setPersonId(note.responsiblePersonId ? String(note.responsiblePersonId) : "");
    setHasTermin(Boolean(note.dueDate || note.responsiblePersonId));
  }, [note.id, note.content, note.noteType, note.dueDate, note.responsiblePersonId]);

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
    if (!editable || !onUpdate) return;
    if (!checked) {
      setDueDate("");
      setPersonId("");
      onUpdate({ dueDate: undefined, responsiblePersonId: undefined });
      return;
    }
    const nextDate = dueDate || new Date().toISOString().slice(0, 10);
    setDueDate(nextDate);
    onUpdate({ dueDate: nextDate, actionStatus: "OPEN" });
  };

  const handleDateChange = (val: string) => {
    setDueDate(val);
    if (editable && onUpdate) onUpdate({ dueDate: val || undefined, actionStatus: val ? "OPEN" : note.actionStatus });
  };

  const handlePersonChange = (val: string) => {
    setPersonId(val);
    if (editable && onUpdate) {
      onUpdate({ responsiblePersonId: val ? Number(val) : undefined, actionStatus: val ? "OPEN" : note.actionStatus });
    }
  };

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2 text-sm md:flex-row md:items-start", className)}>
      <div className="order-2 w-auto truncate pt-0 text-xs text-surface-500 md:order-1 md:w-24 md:shrink-0 md:pt-1.5" title={note.createdByName}>
        {note.createdByName}
      </div>
      <div className="order-1 min-w-0 flex-1 md:order-2">
        {editable ? (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[32px] resize-none overflow-hidden border-0 bg-transparent p-1 leading-relaxed focus:outline-none focus:ring-0"
            rows={1}
            placeholder="Karar / görev metni..."
          />
        ) : (
          <div className="p-1 whitespace-pre-wrap leading-relaxed">{content}</div>
        )}
      </div>
      <div className="order-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 md:contents">
        <div className="w-auto pt-0 text-center font-mono text-xs text-surface-400 md:w-24 md:shrink-0 md:pt-1.5">
          K-{note.id.toString().padStart(5, "0")}
        </div>
        <div className="w-auto md:w-28 md:shrink-0">
          {editable ? (
            <Select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              options={NOTE_TYPE_OPTIONS.filter((o) => o.value !== "")}
              className="h-8 text-xs !py-1 !px-2 bg-transparent border-transparent hover:border-surface-200"
            />
          ) : (
            <div className="pt-0 text-surface-600 md:pt-1.5">{NOTE_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}</div>
          )}
        </div>
        <div className="flex w-full min-w-0 flex-col gap-1.5 md:w-56 md:shrink-0">
          <label className="flex cursor-pointer select-none items-center gap-1.5">
            <Checkbox checked={hasTermin} onChange={handleHasTerminChange} disabled={!editable} />
            <span className="text-xs font-medium text-surface-600 dark:text-slate-200">Termin oluştur</span>
          </label>
          {hasTermin && (
            <div className="grid grid-cols-1 gap-1">
              {editable ? (
                <>
                  <Input type="date" value={dueDate} onChange={(e) => handleDateChange(e.target.value)} className="h-8 text-xs !py-1 !px-2" />
                  <Select options={RESPONSIBLE_OPTIONS} value={personId} onChange={(e) => handlePersonChange(e.target.value)} className="h-8 text-xs !py-1 !px-2" />
                </>
              ) : (
                <div className="flex flex-col gap-0.5 text-xs text-surface-600">
                  {dueDate && <span>{new Date(dueDate).toLocaleDateString("tr-TR")}</span>}
                  {note.responsiblePersonName && <span className="break-words" title={note.responsiblePersonName}>{note.responsiblePersonName}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
