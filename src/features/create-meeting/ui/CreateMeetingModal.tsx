/**
 * CreateMeetingModal — full-featured meeting creation dialog.
 *
 * Uses React Hook Form + Zod for state & validation.
 * Integrates ComboBox + CatalogModal for inline catalog management.
 * Supports conditional fields (planned time, next meeting, previous link).
 */
import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { DatePicker } from "@/shared/ui/DatePicker";
import { TimePicker } from "@/shared/ui/TimePicker";
import { EditableMinutesTemplate } from "./EditableMinutesTemplate";
import { ComboBox } from "@/shared/ui/ComboBox";
import { Checkbox } from "@/shared/ui/Checkbox";
import { useMeetingsList } from "@/entities/meeting/api/queries";

import { CatalogModal } from "@/features/manage-catalog";
import { useCatalog, type CatalogKind } from "@/features/manage-catalog/hooks/useCatalog";
import type { NoteCreatePayload } from "@/entities/note/model";
import { useCompanies, usePersons } from "@/entities/catalog/api/queries";
import { PARTICIPANT_ROLE_LABEL, type ParticipantRole } from "@/entities/participant/model";
import { PersonModal } from "@/pages/catalog/PersonModal";
import type { PersonDto } from "@/types/api";

import {
  createMeetingSchema,
  toMeetingPayload,
  type CreateMeetingFormData,
} from "../model/schema";

export interface CreateMeetingSeed {
  previousMeetingId: number;
  title?: string;
  subject?: string;
  companyId?: number | null;
  projectId?: number | null;
  categoryId?: number | null;
  locationId?: number | null;
  participants?: {
    personId: number;
    role: ParticipantRole;
    fullName: string;
    title?: string;
    companyName?: string;
  }[];
}

export interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReturnType<typeof toMeetingPayload> & { notes?: NoteCreatePayload[] }) => void | Promise<void>;
  isLoading?: boolean;
  /** Zincirden “sonraki toplantıyı planla” ile ön doldurma */
  seed?: CreateMeetingSeed | null;
}

type ActiveCatalog = CatalogKind | null;

interface DraftParticipant {
  personId: number;
  role: ParticipantRole;
  fullName: string;
  title?: string;
  companyName?: string;
}

const EMPTY_FORM: CreateMeetingFormData = {
  title: "",
  subject: "",
  meetingDate: "",
  hasPlannedStart: false,
  plannedStart: "",
  categoryId: null,
  projectId: null,
  companyId: null,
  locationId: null,
  hasNextMeeting: false,
  nextMeetingDate: "",
  nextMeetingTime: "",
  nextMeetingNote: "",
  previousMeetingId: null,
  relationType: "FOLLOW_UP",
  copy_participants: true,
  copyOpenTasks: true,
};

export function CreateMeetingModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  seed = null,
}: CreateMeetingModalProps) {
  // ── Form ──────────────────────────────────────────
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMeetingFormData>({
    resolver: zodResolver(createMeetingSchema) as never,
    defaultValues: EMPTY_FORM,
  });

  // ── Catalogs ──────────────────────────────────────
  const projects = useCatalog("projects");
  const companies = useCatalog("companies");
  const locations = useCatalog("locations");
  const categories = useCatalog("categories");

  const [activeCatalog, setActiveCatalog] = useState<ActiveCatalog>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personDefaultCompanyId, setPersonDefaultCompanyId] = useState<number | null>(null);
  const [draftParticipants, setDraftParticipants] = useState<DraftParticipant[]>([]);
  const [draftNotes, setDraftNotes] = useState<(NoteCreatePayload & { key: number })[]>([]);
  const noteKey = useRef(1);
  const personsQuery = usePersons();
  const companiesQuery = useCompanies();

  // ── Watched values ────────────────────────────────
  const hasNextMeeting = watch("hasNextMeeting");
  const previousMeetingId = watch("previousMeetingId");

  // Previous meetings list for dropdown
  // Yalnızca modal açıkken çekilir; MeetingLinksPanel ile aynı önbellek anahtarı
  const allMeetingsQuery = useMeetingsList({ pageSize: 1000 }, { enabled: isOpen });
  const allMeetings = allMeetingsQuery.data?.items ?? [];

  const previousMeetingOptions = allMeetings.map((m) => ({
    value: m.id,
    label: `${m.meetingDate} · #${m.id} · ${m.title}`,
  }));

  // Açılışta seed uygula; kapanışta sıfırla
  useEffect(() => {
    if (!isOpen) {
      reset(EMPTY_FORM);
      setShowAdvanced(false);
      setShowPersonModal(false);
      setPersonDefaultCompanyId(null);
      setDraftParticipants([]);
      setDraftNotes([]);
      return;
    }

    if (seed) {
      reset({
        ...EMPTY_FORM,
        title: seed.title ?? "",
        subject: seed.subject ?? "",
        companyId: seed.companyId ?? null,
        projectId: seed.projectId ?? null,
        categoryId: seed.categoryId ?? null,
        locationId: seed.locationId ?? null,
        previousMeetingId: seed.previousMeetingId,
        relationType: "CONTINUATION",
        copy_participants: true,
        copyOpenTasks: true,
      });
      setShowAdvanced(true);
      setDraftParticipants(
        (seed.participants ?? []).map((person) => ({
          personId: person.personId,
          role: person.role,
          fullName: person.fullName,
          title: person.title,
          companyName: person.companyName,
        })),
      );
      setDraftNotes([]);
    }
  }, [isOpen, seed, reset]);

  function addParticipants(personIds: number[], knownPeople?: PersonDto[]) {
    const people = knownPeople ?? personsQuery.data ?? [];
    setDraftParticipants((current) => {
      const next = [...current];
      for (const personId of personIds) {
        if (next.some((person) => person.personId === personId)) continue;
        const person = people.find((candidate) => candidate.id === personId);
        next.push({
          personId,
          role: "ATTENDEE",
          fullName: person?.fullName ?? "Kişi",
          title: person?.title ?? undefined,
          companyName: person?.companyName ?? undefined,
        });
      }
      return next;
    });
  }

  function openPersonModal(defaultCompanyId: number | null) {
    setPersonDefaultCompanyId(defaultCompanyId);
    setShowPersonModal(true);
  }

  async function handlePersonSaved(person?: PersonDto) {
    setShowPersonModal(false);
    await personsQuery.refetch();
    if (person) addParticipants([person.id], [person, ...(personsQuery.data ?? [])]);
  }

  function addNote(note: NoteCreatePayload) {
    const key = noteKey.current++;
    setDraftNotes((current) => [...current, { ...note, key }]);
  }

  // ── Submit ────────────────────────────────────────
  async function onFormSubmit(data: CreateMeetingFormData) {
    const payload = {
      ...toMeetingPayload(data),
      participants: draftParticipants.map((person) => ({
        personId: person.personId,
        role: person.role,
      })),
      notes: draftNotes.map(({ key: _key, ...note }) => note),
    };
    await onSubmit(payload);
  }

  // ── Catalog modal helpers ─────────────────────────
  async function handleCatalogCreated(kind: CatalogKind, id?: number) {
    // 1. O kataloğun parent (CreateMeetingModal) state'ini anında yenile
    if (kind === "projects") await projects.refetch();
    else if (kind === "companies") await companies.refetch();
    else if (kind === "locations") await locations.refetch();
    else if (kind === "categories") await categories.refetch();

    // 2. Yeni eklenen bir kayıt varsa formda otomatik seç
    if (id) {
      const fieldMap: Record<CatalogKind, keyof CreateMeetingFormData> = {
        categories: "categoryId",
        projects: "projectId",
        companies: "companyId",
        locations: "locationId",
        titles: "title" as never,
      };
      setValue(fieldMap[kind], id as never);
      setActiveCatalog(null); // Sadece oluşturmada modalı kapat (istenirse açık da bırakılabilir ama böyle daha temiz)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Yeni Toplantı Oluştur"
        description="Toplantı bilgilerini doldurun. Katılımcıları buradan ekleyebilir, notları oluşturduktan sonra girebilirsiniz."
        size="2xl"
        className="md:max-w-4xl"
        footer={
          <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="md:w-auto"
            >
              İptal
            </Button>
            <Button
              type="submit"
              form="create-meeting-form"
              variant="primary"
              isLoading={isLoading}
              className="h-auto w-full rounded-full py-3.5 text-sm md:h-10 md:w-auto md:rounded-lg md:py-0"
            >
              Toplantı Oluştur
            </Button>
          </div>
        }
      >
        <form
          id="create-meeting-form"
          onSubmit={handleSubmit(onFormSubmit as never)}
          className="space-y-6"
          noValidate
        >
          <EditableMinutesTemplate
            register={register}
            control={control}
            setValue={setValue}
            errors={errors}
            disabled={isLoading}
            locationOptions={locations.options}
            companyOptions={companies.options}
            projectOptions={projects.options}
            categoryOptions={categories.options}
            onAddCompany={() => setActiveCatalog("companies")}
            onAddLocation={() => setActiveCatalog("locations")}
            onAddProject={() => setActiveCatalog("projects")}
            onAddCategory={() => setActiveCatalog("categories")}
            onAddPerson={openPersonModal}
            participants={draftParticipants.map((person) => ({
              personId: person.personId,
              fullName: person.fullName,
              companyName: person.companyName,
              roleLabel: PARTICIPANT_ROLE_LABEL[person.role],
            }))}
            people={(personsQuery.data ?? []).filter((person) => person.isActive).map((person) => ({
              id: person.id,
              fullName: person.fullName,
              companyId: person.companyId,
              companyName: person.companyName ?? undefined,
              title: person.title ?? undefined,
            }))}
            notes={draftNotes}
            onAddParticipants={addParticipants}
            onRemoveParticipant={(personId) =>
              setDraftParticipants((current) => current.filter((person) => person.personId !== personId))
            }
            onAddNote={addNote}
            onRemoveNote={(key) => setDraftNotes((current) => current.filter((note) => note.key !== key))}
          />

          {/* ── Advanced (collapsible) ──── */}
          <div className="border-t border-surface-200 pt-4 dark:border-surface-700">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-sm font-semibold text-surface-600 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200"
            >
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Gelişmiş Seçenekler
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-5">
                {/* Next meeting */}
                <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-4 dark:border-surface-700 dark:bg-surface-900/30">
                  <Controller
                    name="hasNextMeeting"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="Sonraki toplantı zamanı belirle"
                        description="Tarih ve not, tutanağın 'Bir sonraki toplantı' bölümüne yansır."
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  {hasNextMeeting && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Controller
                        name="nextMeetingDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Sonraki Toplantı Tarihi"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            error={errors.nextMeetingDate?.message}
                            disabled={isLoading}
                          />
                        )}
                      />
                      <Controller
                        name="nextMeetingTime"
                        control={control}
                        render={({ field }) => (
                          <TimePicker
                            label="Saat"
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                          />
                        )}
                      />

                    </div>
                  )}
                </div>

                {/* Previous meeting link */}
                <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-4 dark:border-surface-700 dark:bg-surface-900/30">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                    <FileText className="h-4 w-4" />
                    Toplantı Bağlantısı
                  </h4>
                  <div className="space-y-3">
                    <Controller
                      name="previousMeetingId"
                      control={control}
                      render={({ field }) => (
                        <ComboBox
                          label="Önceki Toplantı"
                          value={field.value}
                          onChange={field.onChange}
                          options={previousMeetingOptions}
                          placeholder="Bağımsız toplantı"
                          disabled={isLoading}
                        />
                      )}
                    />

                    {previousMeetingId && (
                      <>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                            Bu toplantı öncekinin...
                          </label>
                          <select
                            {...register("relationType")}
                            className="flex h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm text-surface-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-100"
                            disabled={isLoading}
                          >
                            <option value="FOLLOW_UP">Takibi</option>
                            <option value="CONTINUATION">Devamı</option>
                          </select>
                        </div>

                        <Controller
                          name="copy_participants"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              label="Önceki katılımcıları davetli olarak ekle"
                              checked={field.value}
                              onChange={field.onChange}
                              disabled={isLoading}
                            />
                          )}
                        />
                        <Controller
                          name="copyOpenTasks"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              label="Açık ve süren görevleri bu toplantıya aktar"
                              description="Aktarılan işler tek takip kaydında izlenir; güncel termin ve durumları kullanılır."
                              checked={field.value}
                              onChange={field.onChange}
                              disabled={isLoading}
                            />
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ── Nested Catalog Modals ─────────────────── */}
      {activeCatalog && (
        <CatalogModal
          isOpen={!!activeCatalog}
          onClose={() => setActiveCatalog(null)}
          kind={activeCatalog}
          onCreated={(id) => handleCatalogCreated(activeCatalog, id)}
          onDeleted={() => handleCatalogCreated(activeCatalog)}
        />
      )}

      <PersonModal
        isOpen={showPersonModal}
        onClose={() => setShowPersonModal(false)}
        onSaved={handlePersonSaved}
        editingPerson={null}
        companies={companiesQuery.data ?? []}
        defaultCompanyId={personDefaultCompanyId}
      />
    </>
  );
}
