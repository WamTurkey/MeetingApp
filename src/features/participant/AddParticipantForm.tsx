/**
 * AddParticipantForm — person-based participant addition.
 *
 * - Searchable ComboBox pulling from the active Persons pool.
 * - Auto-fills person data (name, email, title, company) on selection.
 * - Quick-add button for creating new persons inline.
 * - Outputs a clean { meeting_id, person_id, role } payload.
 */
import { useState, useMemo, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { ComboBox, type ComboBoxOption } from "@/shared/ui/ComboBox";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Checkbox } from "@/shared/ui/Checkbox";
import type { SelectOption } from "@/shared/types/common";
import type {
  ParticipantCreatePayload,
  ParticipantRole,
  Participant,
} from "@/entities/participant/model";
import { PARTICIPANT_ROLE_LABEL } from "@/entities/participant/model";
import { MOCK_PEOPLE } from "@/entities/person/mock";
import { MOCK_COMPANIES } from "@/entities/company/mock";
import type { Person } from "@/entities/person/model";

/* ── Role options ────────────────────────────────── */

const ROLE_OPTIONS: SelectOption<ParticipantRole>[] = (
  Object.entries(PARTICIPANT_ROLE_LABEL) as [ParticipantRole, string][]
).map(([value, label]) => ({ value, label }));

/* ── Props ───────────────────────────────────────── */

export interface AddParticipantFormProps {
  meetingId: number;
  /** Existing participants to exclude from the dropdown. */
  existingParticipants?: Participant[];
  onSubmit: (data: ParticipantCreatePayload) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

/* ── Component ───────────────────────────────────── */

export function AddParticipantForm({
  meetingId,
  existingParticipants = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: AddParticipantFormProps) {
  // People pool
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [role, setRole] = useState<ParticipantRole>("ATTENDEE");
  const [error, setError] = useState("");

  // Quick-add person modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCompanyId, setQuickCompanyId] = useState<string>("");
  const [quickActive, setQuickActive] = useState(true);

  // Exclude already-added participants from dropdown
  const existingPersonIds = useMemo(
    () => new Set(existingParticipants.map((p) => p.person_id)),
    [existingParticipants],
  );

  // ComboBox options — show "Ad Soyad — Unvan / Şirket"
  const personOptions: ComboBoxOption[] = useMemo(
    () =>
      people
        .filter((p) => p.active && !existingPersonIds.has(p.id))
        .map((p) => ({
          value: p.id,
          label: `${p.full_name}${p.title || p.company_name ? " — " : ""}${[p.title, p.company_name].filter(Boolean).join(" / ")}`,
        })),
    [people, existingPersonIds],
  );

  // Selected person details
  const selectedPerson = useMemo(
    () => (selectedPersonId ? people.find((p) => p.id === selectedPersonId) : null),
    [selectedPersonId, people],
  );

  // Company options for quick-add
  const companyOptions: SelectOption[] = useMemo(
    () => MOCK_COMPANIES.filter((c) => c.active).map((c) => ({ value: String(c.id), label: c.name })),
    [],
  );

  /* ── Submit ──────────────────────────────────── */

  async function handleSubmit() {
    if (!selectedPersonId) {
      setError("Lütfen bir kişi seçiniz.");
      return;
    }
    setError("");
    await onSubmit({
      meeting_id: meetingId,
      person_id: selectedPersonId,
      role,
    });
    // Reset
    setSelectedPersonId(null);
    setRole("ATTENDEE");
  }

  /* ── Quick-add person ────────────────────────── */

  const handleQuickAddSave = useCallback(() => {
    if (!quickName.trim()) return;
    const company = quickCompanyId
      ? MOCK_COMPANIES.find((c) => c.id === Number(quickCompanyId))
      : null;
    const newPerson: Person = {
      id: Date.now(),
      full_name: quickName.trim(),
      email: quickEmail.trim(),
      title: quickTitle.trim(),
      phone: "",
      company_id: company ? company.id : null,
      company_name: company?.name,
      active: quickActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPeople((prev) => [...prev, newPerson]);
    setSelectedPersonId(newPerson.id);
    setShowQuickAdd(false);
    // Reset quick-add form
    setQuickName("");
    setQuickEmail("");
    setQuickTitle("");
    setQuickCompanyId("");
    setQuickActive(true);
  }, [quickName, quickEmail, quickTitle, quickCompanyId, quickActive]);

  return (
    <>
      <div className="space-y-4">
        {/* ── Person selector + Role ──────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
          <ComboBox
            label="Kişi Seçiniz"
            placeholder="Aramak için yazmaya başlayın..."
            value={selectedPersonId}
            onChange={(val) => {
              setSelectedPersonId(val);
              setError("");
            }}
            options={personOptions}
            onAddNew={() => setShowQuickAdd(true)}
            addNewLabel="Yeni Kişi Ekle"
            error={error}
          />

          <Select
            label="Rol"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as ParticipantRole)}
            disabled={isLoading}
          />
        </div>

        {/* ── Selected person preview ─────────────── */}
        {selectedPerson && (
          <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950/20">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {selectedPerson.full_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate dark:text-surface-50">
                {selectedPerson.full_name}
              </p>
              <p className="text-xs text-surface-500 truncate dark:text-surface-400">
                {[selectedPerson.title, selectedPerson.company_name, selectedPerson.email]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 pt-1">
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
            type="button"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            icon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={handleSubmit}
          >
            Katılımcı Ekle
          </Button>
        </div>
      </div>

      {/* ── Quick-Add Person Modal (Nested) ────────── */}
      <Modal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Yeni Kişi Ekle"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Ad Soyad *"
            placeholder="Örn: Fatma Şahin"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Unvan"
              placeholder="Örn: Proje Müdürü"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@sirket.com"
              value={quickEmail}
              onChange={(e) => setQuickEmail(e.target.value)}
            />
          </div>
          <Select
            label="Firma"
            placeholder="Firma seçiniz (opsiyonel)"
            options={companyOptions}
            value={quickCompanyId}
            onChange={(e) => setQuickCompanyId(e.target.value)}
          />
          <Checkbox
            label="Aktif kişi"
            description="Pasif kişiler dropdown'da görünmez."
            checked={quickActive}
            onChange={setQuickActive}
          />
          <div className="flex items-center justify-end gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickAdd(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={handleQuickAddSave}
              disabled={!quickName.trim()}
            >
              Kişiyi Kaydet ve Seç
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
