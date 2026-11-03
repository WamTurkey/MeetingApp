import { useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { AddNoteForm } from "@/features/note/AddNoteForm";
import { SpeechToTextButton } from "@/features/voice-note";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { cn } from "@/shared/lib/cn";
import type { NoteCreatePayload } from "@/entities/note/model";
import type { CreateMeetingFormData } from "../model/schema";

interface DraftPerson {
  personId: number;
  fullName: string;
  companyName?: string;
  roleLabel?: string;
}

interface PersonChoice {
  id: number;
  fullName: string;
  companyId?: number | null;
  companyName?: string;
  title?: string;
}

interface DraftEntry extends NoteCreatePayload {
  key: number;
}

interface EditableMinutesTemplateProps {
  register: UseFormRegister<CreateMeetingFormData>;
  control: Control<CreateMeetingFormData>;
  setValue: UseFormSetValue<CreateMeetingFormData>;
  errors: FieldErrors<CreateMeetingFormData>;
  disabled?: boolean;
  participants: DraftPerson[];
  people: PersonChoice[];
  notes: DraftEntry[];
  onAddParticipants: (personIds: number[]) => void;
  onRemoveParticipant: (personId: number) => void;
  onAddNote: (note: NoteCreatePayload) => void;
  onRemoveNote: (key: number) => void;
  locationOptions: { value: number; label: string }[];
  companyOptions: { value: number; label: string }[];
  projectOptions: { value: number; label: string }[];
  categoryOptions: { value: number; label: string }[];
  onAddCompany: () => void;
  onAddLocation: () => void;
  onAddProject: () => void;
  onAddCategory: () => void;
  onAddPerson: (defaultCompanyId: number | null) => void;
}

const fieldClass =
  "w-full bg-transparent text-black outline-none placeholder:text-neutral-400 border-b border-dashed border-neutral-300 focus:border-blue-600";

function NumberedLine({ index, children }: { index: number | string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="w-4 shrink-0 tabular-nums">{index}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
    </div>
  );
}

function TwoCol({ left, right, className }: { left: ReactNode; right: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2", className)}>
      <div className="min-w-0 break-words border-neutral-300 p-2 sm:border-r">{left}</div>
      <div className="min-w-0 break-words border-t border-neutral-300 p-2 sm:border-t-0">{right}</div>
    </div>
  );
}

type CatalogFieldName = "companyId" | "locationId" | "projectId" | "categoryId";

function CatalogSelect({
  name,
  control,
  ariaLabel,
  placeholder,
  options,
  disabled,
  onAdd,
  addLabel,
  error,
}: {
  name: CatalogFieldName;
  control: Control<CreateMeetingFormData>;
  ariaLabel: string;
  placeholder: string;
  options: { value: number; label: string }[];
  disabled?: boolean;
  onAdd: () => void;
  addLabel: string;
  error?: string;
}) {
  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-1.5">
            <select
              value={field.value ?? ""}
              disabled={disabled}
              aria-label={ariaLabel}
              onChange={(event) => {
                const value = event.target.value;
                field.onChange(value ? Number(value) : null);
              }}
              className={cn(fieldClass, "cursor-pointer appearance-auto")}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled}
              onClick={onAdd}
              className="shrink-0 rounded border border-neutral-300 p-1 text-neutral-600 hover:bg-neutral-100 hover:text-black disabled:opacity-50"
              aria-label={addLabel}
              title={addLabel}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </>
  );
}

export function EditableMinutesTemplate({
  register,
  control,
  setValue,
  errors,
  disabled,
  participants,
  people,
  notes,
  onAddParticipants,
  onRemoveParticipant,
  onAddNote,
  onRemoveNote,
  locationOptions,
  companyOptions,
  projectOptions,
  categoryOptions,
  onAddCompany,
  onAddLocation,
  onAddProject,
  onAddCategory,
  onAddPerson,
}: EditableMinutesTemplateProps) {
  const meetingCompanyId = useWatch({ control, name: "companyId" }) as number | null | undefined;
  const [participantCompanyId, setParticipantCompanyId] = useState<number | null>(null);

  useEffect(() => {
    setParticipantCompanyId(meetingCompanyId ?? null);
  }, [meetingCompanyId]);

  const selectedIds = new Set(participants.map((person) => person.personId));
  const availablePeople = people.filter((person) => {
    if (selectedIds.has(person.id)) return false;
    if (participantCompanyId == null) return false;
    return person.companyId === participantCompanyId;
  });
  const bodyNotes = notes.filter((note) => note.noteType !== "DECISION");
  const decisions = notes.filter((note) => note.noteType === "DECISION");

  return (
    <div className="min-w-0 bg-white text-black [color-scheme:light]">
      <div className="w-full min-w-0 overflow-visible border-2 border-neutral-500 font-sans text-[12px] leading-snug text-black sm:border-[3px] sm:text-[13px]">
        <div className="border-b-2 border-neutral-500 p-2 sm:border-b-[3px]">
          <div className="mb-2 font-bold">TOPLANTININ KONUSU</div>
          <div className="space-y-2">
            <input
              {...register("title")}
              disabled={disabled}
              placeholder="Toplantı başlığını yazın"
              aria-label="Toplantı başlığı"
              className={cn(fieldClass, "text-base font-bold")}
            />
            {errors.title?.message && <p className="text-[11px] text-red-600">{errors.title.message}</p>}
            <input
              {...register("subject")}
              disabled={disabled}
              placeholder="Toplantı konusunu yazın"
              aria-label="Toplantı konusu"
              className={cn(fieldClass, "text-base")}
            />
            {errors.subject?.message && <p className="text-[11px] text-red-600">{errors.subject.message}</p>}
            <CatalogSelect
              name="companyId"
              control={control}
              ariaLabel="Firma"
              placeholder="Firma seçin"
              options={companyOptions}
              disabled={disabled}
              onAdd={onAddCompany}
              addLabel="Yeni firma ekle"
              error={errors.companyId?.message}
            />
            <CatalogSelect
              name="locationId"
              control={control}
              ariaLabel="Yer"
              placeholder="Yer seçin"
              options={locationOptions}
              disabled={disabled}
              onAdd={onAddLocation}
              addLabel="Yeni yer ekle"
              error={errors.locationId?.message}
            />
            <CatalogSelect
              name="projectId"
              control={control}
              ariaLabel="Proje"
              placeholder="Proje seçin"
              options={projectOptions}
              disabled={disabled}
              onAdd={onAddProject}
              addLabel="Yeni proje ekle"
              error={errors.projectId?.message}
            />
            <CatalogSelect
              name="categoryId"
              control={control}
              ariaLabel="Toplantı kategorisi"
              placeholder="Kategori seçin"
              options={categoryOptions}
              disabled={disabled}
              onAdd={onAddCategory}
              addLabel="Yeni kategori ekle"
              error={errors.categoryId?.message}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Controller
                name="meetingDate"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    value={field.value}
                    disabled={disabled}
                    aria-label="Tarih"
                    onChange={field.onChange}
                    className={fieldClass}
                  />
                )}
              />
              <Controller
                name="plannedStart"
                control={control}
                render={({ field }) => (
                  <input
                    type="time"
                    value={field.value ?? ""}
                    disabled={disabled}
                    aria-label="Başlangıç saati"
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value);
                      setValue("hasPlannedStart", value.length > 0);
                    }}
                    className={fieldClass}
                  />
                )}
              />
            </div>
            {errors.meetingDate?.message && <p className="text-[11px] text-red-600">{errors.meetingDate.message}</p>}
            {errors.plannedStart?.message && <p className="text-[11px] text-red-600">{errors.plannedStart.message}</p>}
          </div>
        </div>

        <div className="border-b-2 border-neutral-500 bg-neutral-50 p-2 font-bold sm:hidden">KATILIMCILAR</div>
        <TwoCol
          className="hidden border-b-[3px] border-neutral-500 bg-neutral-50 sm:grid"
          left={<div className="font-bold">KATILIMCILAR</div>}
          right={<div className="font-bold">Ad ve Soyad</div>}
        />
        <div className="relative border-b-2 border-neutral-500 p-2 sm:border-b-[3px]">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Katılımcı firması
          </label>
          <select
            value={participantCompanyId ?? ""}
            disabled={disabled || companyOptions.length === 0}
            aria-label="Katılımcı firması"
            onChange={(event) => {
              const value = event.target.value;
              setParticipantCompanyId(value ? Number(value) : null);
            }}
            className="mb-2 w-full border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-blue-600"
          >
            <option value="">Firma seçin</option>
            {companyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mb-2 text-[11px] text-neutral-500">
            Başka firmadan eklemek için firmayı değiştirin. Toplantı firması değişmez.
          </p>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Katılımcı ara
          </label>
          <ParticipantSearch
            people={availablePeople}
            disabled={disabled || participantCompanyId == null}
            emptyHint={participantCompanyId == null ? "Önce firma seçin" : undefined}
            onAdd={onAddParticipants}
            onAddPerson={() => onAddPerson(participantCompanyId)}
          />
        </div>
        {participants.length > 0 && (
          <div className="border-b-2 border-neutral-500 sm:border-b-[3px]">
            {participants.map((person, index) => (
              <TwoCol
                key={person.personId}
                className={index > 0 ? "border-t border-neutral-200" : undefined}
                left={<NumberedLine index={index + 1}>{person.companyName || person.roleLabel || "—"}</NumberedLine>}
                right={
                  <div className="flex items-center justify-between gap-2">
                    <span>{person.fullName}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(person.personId)}
                      className="text-neutral-400 hover:text-red-600"
                      aria-label={`${person.fullName} katılımcısını çıkar`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}

        <div className="min-w-0 border-b-2 border-neutral-500 sm:border-b-[3px]">
          <div className="p-2 font-bold">NOTLAR</div>
          {bodyNotes.length === 0 ? (
            <div className="px-2 pb-2">
              <NumberedLine index={1}>—</NumberedLine>
            </div>
          ) : (
            bodyNotes.map((note, index) => (
              <div key={note.key} className="flex items-start gap-2 px-2 py-1">
                <NumberedLine index={index + 1}>{note.content}</NumberedLine>
                <button type="button" onClick={() => onRemoveNote(note.key)} className="text-neutral-400 hover:text-red-600" aria-label="Notu çıkar">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          <AddNoteForm embedded meetingId={0} onSubmit={onAddNote} />
        </div>

        <div className="p-2">
          <div className="mb-1 font-bold">ALINAN KARARLAR</div>
          {decisions.length === 0 ? (
            <NumberedLine index={1}>—</NumberedLine>
          ) : (
            decisions.map((decision, index) => (
              <div key={decision.key} className="flex items-start gap-2 py-1">
                <NumberedLine index={index + 1}>
                  {decision.content}
                  {decision.dueDate ? ` · ${decision.dueDate}` : ""}
                </NumberedLine>
                <button type="button" onClick={() => onRemoveNote(decision.key)} className="text-neutral-400 hover:text-red-600" aria-label="Kararı çıkar">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          <DecisionComposer disabled={disabled} onAdd={onAddNote} />
        </div>
      </div>
    </div>
  );
}

function personMatches(person: PersonChoice, query: string) {
  const haystack = [person.fullName, person.title, person.companyName]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");
  return haystack.includes(query);
}

function ParticipantSearch({
  people,
  disabled,
  emptyHint,
  onAdd,
  onAddPerson,
}: {
  people: PersonChoice[];
  disabled?: boolean;
  emptyHint?: string;
  onAdd: (personIds: number[]) => void;
  onAddPerson: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = query.trim().toLocaleLowerCase("tr-TR");
  const suggestions = normalized ? people.filter((person) => personMatches(person, normalized)) : people;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, people]);

  function pick(person: PersonChoice) {
    onAdd([person.id]);
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-1.5">
        <input
          type="search"
          value={query}
          disabled={disabled}
          autoComplete="off"
          placeholder={emptyHint || "Kişi adı, unvan veya firma yazın"}
          aria-label="Katılımcı ara"
          aria-expanded={open}
          aria-autocomplete="list"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => Math.min(current + 1, Math.max(suggestions.length - 1, 0)));
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
              return;
            }
            if (event.key === "Enter" && open && suggestions[activeIndex]) {
              event.preventDefault();
              pick(suggestions[activeIndex]);
            }
          }}
          className="w-full border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-blue-600 disabled:bg-neutral-50 disabled:text-neutral-400"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onAddPerson}
          className="shrink-0 rounded border border-neutral-300 p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-black disabled:opacity-50"
          aria-label="Yeni kişi ekle"
          title="Sistemde olmayan kişi ekle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute left-0 right-10 z-[400] mt-1 max-h-48 overflow-auto border border-neutral-300 bg-white text-black shadow-lg"
        >
          {suggestions.length === 0 ? (
            <li className="px-2 py-1.5 text-neutral-500">
              {people.length === 0 ? "Bu firmada eklenecek kişi kalmadı" : "Eşleşen kişi yok"}
              <span className="mt-1 block text-[11px]">Yeni kişi için + düğmesini kullanın</span>
            </li>
          ) : (
            suggestions.map((person, index) => {
              const detail = [person.title, person.companyName].filter(Boolean).join(" / ");
              return (
                <li key={person.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(person)}
                    className={cn(
                      "flex w-full flex-col items-start px-2 py-1.5 text-left",
                      index === activeIndex ? "bg-blue-50" : "hover:bg-neutral-100",
                    )}
                  >
                    <span className="font-medium">{person.fullName}</span>
                    {detail && <span className="text-[11px] text-neutral-500">{detail}</span>}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function DecisionComposer({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd: (note: NoteCreatePayload) => void;
}) {
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);

  function save() {
    if (!content.trim()) return;
    onAdd({
      content: content.trim(),
      noteType: "DECISION",
      dueDate: dueDate || undefined,
      actionStatus: "OPEN",
    });
    setContent("");
    setDueDate("");
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="mt-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          Karar Ekle
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-neutral-300 bg-neutral-50 p-3 text-black">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-600">Karar Metni *</label>
          <SpeechToTextButton
            onTranscript={(text) => setContent((current) => (current ? `${current} ${text}` : text))}
            className="h-6 px-2 text-2xs"
          />
        </div>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Toplantıda alınan nihai kararı veya eylemi buraya yazın..."
          rows={3}
          disabled={disabled}
        />
      </div>
      <Input
        type="date"
        label="Hedef / Termin Tarihi"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
        disabled={disabled}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
          İptal
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={disabled || !content.trim()} onClick={save}>
          Kararı Kaydet
        </Button>
      </div>
    </div>
  );
}
