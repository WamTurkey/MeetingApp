/**
 * CreateMeetingModal — full-featured meeting creation dialog.
 *
 * Uses React Hook Form + Zod for state & validation.
 * Integrates ComboBox + CatalogModal for inline catalog management.
 * Supports conditional fields (planned time, next meeting, previous link).
 */
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  FileText,
  Link2,
  FolderKanban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import { DatePicker } from "@/shared/ui/DatePicker";
import { TimePicker } from "@/shared/ui/TimePicker";
import { ComboBox } from "@/shared/ui/ComboBox";
import { Checkbox } from "@/shared/ui/Checkbox";

import { CatalogModal } from "@/features/manage-catalog";
import { useCatalog, type CatalogKind } from "@/features/manage-catalog/hooks/useCatalog";

import { MOCK_MEETINGS } from "@/entities/meeting/mock";

import {
  createMeetingSchema,
  toMeetingPayload,
  type CreateMeetingFormData,
} from "../model/schema";

export interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReturnType<typeof toMeetingPayload>) => void | Promise<void>;
  isLoading?: boolean;
}

type ActiveCatalog = CatalogKind | null;

export function CreateMeetingModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
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
    defaultValues: {
      title: "",
      subject: "",
      meeting_date: "",
      has_planned_start: false,
      planned_start: "",
      category_id: null,
      project_id: null,
      company_id: null,
      location_id: null,
      has_next_meeting: false,
      next_meeting_date: "",
      next_meeting_time: "",
      next_meeting_note: "",
      previous_meeting_id: null,
      relation_type: "FOLLOW_UP",
      copy_participants: true,
      copy_open_tasks: true,
    },
  });

  // ── Catalogs ──────────────────────────────────────
    const projects = useCatalog("projects");
  const companies = useCatalog("companies");
  const locations = useCatalog("locations");

  const [activeCatalog, setActiveCatalog] = useState<ActiveCatalog>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Watched values ────────────────────────────────
  const hasPlannedStart = watch("has_planned_start");
  const hasNextMeeting = watch("has_next_meeting");
  const previousMeetingId = watch("previous_meeting_id");

  // Previous meetings list for dropdown
  const previousMeetingOptions = MOCK_MEETINGS.map((m) => ({
    value: m.id,
    label: `${m.meeting_date} · #${m.id} · ${m.title}`,
  }));

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowAdvanced(false);
    }
  }, [isOpen, reset]);

  // ── Submit ────────────────────────────────────────
  async function onFormSubmit(data: CreateMeetingFormData) {
    const payload = toMeetingPayload(data);
    await onSubmit(payload);
  }

  // ── Catalog modal helpers ─────────────────────────
  function handleCatalogCreated(kind: CatalogKind, id: number) {
    const fieldMap: Record<CatalogKind, keyof CreateMeetingFormData> = {
      categories: "category_id",
      projects: "project_id",
      companies: "company_id",
      locations: "location_id",
    };
    setValue(fieldMap[kind], id as never);
    setActiveCatalog(null);
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Yeni Toplantı Oluştur"
        description="Toplantı bilgilerini doldurun. Oluşturduktan sonra not ve katılımcı ekleyebilirsiniz."
        size="2xl"
      >
        <form
          onSubmit={handleSubmit(onFormSubmit as never)}
          className="space-y-6"
          noValidate
        >
          {/* ── SECTION 1: Core Fields ──────────────── */}
          <section className="space-y-4">
            <Input
              label="Toplantı Başlığı *"
              placeholder="Örn: Q3 Stratejik Planlama Toplantısı"
              {...register("title")}
              error={errors.title?.message}
              disabled={isLoading}
              autoFocus
            />

            <Textarea
              label="Konu / Gündem"
              placeholder="Toplantının gündem maddeleri ve kapsamı..."
              {...register("subject")}
              helperText="İsteğe bağlı — tutanakta görünür"
              disabled={isLoading}
            />
          </section>

          {/* ── SECTION 2: Date & Time ─────────────── */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <Calendar className="h-4 w-4" />
              Tarih ve Saat
            </h3>
            <div className="grid gap-4 sm:grid-cols-1">
              <Controller
                name="meeting_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Toplantı Tarihi *"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.meeting_date?.message}
                    disabled={isLoading}
                  />
                )}
              />

              <div className="space-y-2">
                <Controller
                  name="has_planned_start"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label="Planlanan saat belirle"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                {hasPlannedStart && (
                  <Controller
                    name="planned_start"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.planned_start?.message}
                        disabled={isLoading}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION 3: Catalog Selectors ───────── */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <FolderKanban className="h-4 w-4" />
              Sınıflandırma
            </h3>
            <div className="grid gap-4 sm:grid-cols-1">
              
              <Controller
                name="project_id"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    label="Proje"
                    value={field.value}
                    onChange={field.onChange}
                    options={projects.options}
                    placeholder="Proje seçin"
                    onAddNew={() => setActiveCatalog("projects")}
                    addNewLabel="Proje"
                    disabled={isLoading}
                  />
                )}
              />
              <Controller
                name="company_id"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    label="Firma"
                    value={field.value}
                    onChange={field.onChange}
                    options={companies.options}
                    placeholder="Firma seçin"
                    onAddNew={() => setActiveCatalog("companies")}
                    addNewLabel="Firma"
                    disabled={isLoading}
                  />
                )}
              />
              <Controller
                name="location_id"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    label="Toplantı Yeri"
                    value={field.value}
                    onChange={field.onChange}
                    options={locations.options}
                    placeholder="Yer seçin"
                    onAddNew={() => setActiveCatalog("locations")}
                    addNewLabel="Yer"
                    disabled={isLoading}
                  />
                )}
              />
            </div>
          </section>

          {/* ── SECTION 4: Advanced (collapsible) ──── */}
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
                    name="has_next_meeting"
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
                        name="next_meeting_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Sonraki Toplantı Tarihi"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            error={errors.next_meeting_date?.message}
                            disabled={isLoading}
                          />
                        )}
                      />
                      <Controller
                        name="next_meeting_time"
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
                      <div className="sm:col-span-2">
                        <Input
                          label="Sonraki Toplantı Notu"
                          placeholder="Örn: Revize teklifler değerlendirilecek..."
                          {...register("next_meeting_note")}
                          disabled={isLoading}
                        />
                      </div>
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
                      name="previous_meeting_id"
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
                            {...register("relation_type")}
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
                          name="copy_open_tasks"
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

          {/* ── Actions ───────────────────────────── */}
          <div className="flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-surface-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              Toplantı Oluştur
            </Button>
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
        />
      )}
    </>
  );
}
