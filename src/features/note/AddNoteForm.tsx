import React from "react";
/**
 * AddNoteForm — add a new note/minute to a meeting.
 *
 * Collects content (textarea), type (select), and optionally:
 * termin (deadline date), sorumlu (responsible person), durum (status).
 */
import { type FormEvent, useState, useRef } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Input } from "@/shared/ui/Input";
import { NOTE_TYPE_OPTIONS } from "@/entities/note/constants";
import type { NoteCreatePayload } from "@/entities/note/model";
import type { NoteType, ActionStatus } from "@/shared/config/constants";
import { usePersons } from "@/entities/catalog/api/queries";
import type { PersonDto } from "@/types/api";
import { cn } from "@/shared/lib/cn";
import { SpeechToTextButton } from "@/features/voice-note";


// RESPONSIBLE_OPTIONS is now computed inside the component using personOptions hook

export interface AddNoteFormProps {
  meetingId: number;
  onSubmit: (data: NoteCreatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialContent?: string;
  layout?: "inline" | "stacked";
  /** Dışarıda başka bir form varken iç içe `<form>` açmamak için. */
  embedded?: boolean;
}

/**
 * Aktif kişi seçenekleri — React Query önbelleğinden.
 * Her not satırı bu hook'u çağırsa da ağa tek `GET /Persons` isteği gider (önceden satır başına 1 istek).
 */
export function usePersonOptions() {
  const { data } = usePersons();
  return React.useMemo(
    () => (data ?? []).filter((p) => p.isActive).map((p: PersonDto) => ({ value: p.id, label: p.fullName })),
    [data],
  );
}

export function AddNoteForm({
  meetingId: _meetingId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialContent = "",
  layout = "inline",
  embedded = false,
}: AddNoteFormProps) {
  const personOptions = usePersonOptions();
  const RESPONSIBLE_OPTIONS = [
    { value: "", label: "Seçilmedi" },
    ...personOptions.map(p => ({ value: String(p.value), label: p.label })),
  ];
  const [content, setContent] = useState(initialContent);

  React.useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);
  const [type, setType] = useState<NoteType>("NOTE");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function submitNote() {
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
      actionStatus: status ? (status as ActionStatus) : hasDeadline ? "OPEN" : undefined,
    });

    setContent("");
    setType("NOTE");
    setHasDeadline(false);
    setDeadline("");
    setResponsibleId("");
    setStatus("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submitNote();
  }

  // Filter out the empty "Tüm Tipler" option
  const typeOptions = NOTE_TYPE_OPTIONS.filter((o) => o.value !== "");

  if (embedded && layout !== "stacked") {
    return (
      <NoteFormShell
        embedded
        onSubmit={handleSubmit}
        className="min-w-0 space-y-2 overflow-hidden px-2 py-2"
      >
        <div className="flex min-w-0 items-start gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submitNote();
              }
            }}
            className={cn(
              "min-h-[32px] min-w-0 flex-1 resize-none overflow-hidden rounded border bg-white p-1 text-sm leading-relaxed text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 dark:bg-surface-900 dark:text-surface-100",
              error ? "border-danger-500 focus:ring-danger-500" : "border-surface-200 focus:border-brand-500 focus:ring-brand-500",
            )}
            rows={1}
            placeholder="Not metni"
          />
          <SpeechToTextButton
            size="sm"
            showLabel
            label="Sesle Dikte"
            className="max-w-full shrink-0"
            onTranscript={(text) => {
              setContent((prev) => (prev ? prev + " " + text : text));
              if (error) setError("");
            }}
          />
        </div>
        {error && <p className="text-xs text-danger-500">{error}</p>}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="min-w-0 w-28 shrink-0">
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => setType(e.target.value as NoteType)}
              disabled={isLoading}
              className="h-8 text-xs !py-1 !px-2 bg-white dark:bg-surface-900"
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              checked={hasDeadline}
              onChange={(c) => { setHasDeadline(c); if (!c) { setDeadline(""); setResponsibleId(""); } }}
              disabled={isLoading}
            />
            <span className="text-xs text-surface-600">Termin</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!p-1 text-brand-600 hover:text-brand-700 hover:bg-brand-50"
            onClick={() => void submitNote()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {hasDeadline && (
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
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
      </NoteFormShell>
    );
  }

  if (layout === "stacked") {
    return (
      <NoteFormShell embedded={embedded} onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-surface-600">Not metni *</label>
          <SpeechToTextButton
            size="sm"
            showLabel
            label="Sesle Dikte"
            onTranscript={(text) => {
              setContent((prev) => (prev ? prev + " " + text : text));
              if (error) setError("");
            }}
          />
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError("");
          }}
          className={cn(
            "min-h-24 w-full rounded-2xl border bg-surface-100 p-3 text-sm text-surface-900 placeholder:text-surface-400 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500",
            error ? "border-danger-500" : "border-[#C8D5D1]",
          )}
          placeholder="Not metni yazın veya mikrofonla sesle dikte edin..."
          autoFocus
        />
        {error && <p className="text-xs text-danger-500">{error}</p>}
        <Select
          label="Tür"
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          disabled={isLoading}
        />
        <label className="flex items-center gap-2 text-sm text-surface-600">
          <Checkbox
            checked={hasDeadline}
            onChange={(c) => { setHasDeadline(c); if (!c) { setDeadline(""); setResponsibleId(""); } }}
            disabled={isLoading}
          />
          Termin ekle
        </label>
        {hasDeadline && (
          <>
            <Input type="date" label="Termin Tarihi" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <Select label="Sorumlu" options={RESPONSIBLE_OPTIONS} value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} />
          </>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>İptal</Button>
          )}
          <Button
            type={embedded ? "button" : "submit"}
            variant="primary"
            isLoading={isLoading}
            className="h-auto w-full rounded-full py-3.5 text-sm"
            onClick={embedded ? () => void submitNote() : undefined}
          >
            Kaydet
          </Button>
        </div>
      </NoteFormShell>
    );
  }

  return (
    <NoteFormShell embedded={embedded} onSubmit={handleSubmit} className="flex w-full items-start gap-2 text-sm py-2 px-3 bg-surface-50/80 dark:bg-surface-800/50 border-b border-brand-200 dark:border-brand-800/50 relative shadow-inner ring-1 ring-inset ring-brand-100 dark:ring-brand-900/30">
      <div className="w-6 shrink-0 pt-1.5 flex justify-center text-surface-300 opacity-50 cursor-not-allowed">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="w-24 shrink-0 text-xs text-surface-400 font-medium pt-1.5 truncate">
        Yeni Not...
      </div>
      <div className="flex-1 min-w-[200px] relative">
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
              void submitNote();
            }
          }}
          className={cn(
            "w-full resize-none overflow-hidden rounded border bg-white p-1 pr-24 text-sm leading-relaxed text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 min-h-[32px]",
            error ? "border-danger-500 focus:ring-danger-500" : "border-surface-200 focus:border-brand-500 focus:ring-brand-500"
          )}
          rows={1}
          placeholder="Not metni yazın veya mikrofonla sesle dikte edin..."
          autoFocus
        />
        <div className="absolute right-1.5 top-0.5">
          <SpeechToTextButton
            size="sm"
            showLabel
            label="Sesle Dikte"
            onTranscript={(text) => {
              setContent((prev) => (prev ? prev + " " + text : text));
              if (error) setError("");
            }}
          />
        </div>
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
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type={embedded ? "button" : "submit"}
          variant="ghost"
          size="sm"
          className="!p-1 text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30"
          onClick={embedded ? () => void submitNote() : undefined}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      </NoteFormShell>
  );
}

function NoteFormShell({
  embedded,
  className,
  onSubmit,
  children,
}: {
  embedded: boolean;
  className: string;
  onSubmit: (event: FormEvent) => void;
  children: React.ReactNode;
}) {
  if (embedded) return <div className={className}>{children}</div>;
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
