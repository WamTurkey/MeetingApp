/**
 * AddParticipantForm — person-based participant addition.
 *
 * - Company filter dropdown to narrow person list.
 * - Searchable ComboBox pulling from the active Persons pool.
 * - Auto-fills person data (name, email, title, company) on selection.
 * - Quick-add button for creating new persons inline.
 * - Outputs a clean { meeting_id, person_id, role } payload.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { UserPlus, Building2 } from "lucide-react";
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
import { fetchPersons, fetchCompanies } from "@/services/catalogService";
import type { PersonDto, CompanyDto } from "@/types/api";
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
  meetingId: _meetingId,
  existingParticipants = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: AddParticipantFormProps) {
  // People + Companies pool
  const [people, setPeople] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
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

  // Load persons and companies on mount
  useEffect(() => {
    fetchPersons().then(data => {
      setPeople(data.map((p: PersonDto) => ({
        id: p.id, fullName: p.fullName, email: p.email ?? "", title: p.title ?? "",
        companyId: p.companyId, companyName: p.companyName ?? undefined, isActive: p.isActive,
        phone: p.phone ?? "", createdAt: "", updatedAt: "",
      } as Person)));
    }).catch(console.error);

    fetchCompanies().then(data => {
      setCompanies(data.filter(c => c.isActive));
    }).catch(console.error);
  }, []);

  // Exclude already-added participants from dropdown
  const existingPersonIds = useMemo(
    () => new Set(existingParticipants.map((p) => p.personId)),
    [existingParticipants],
  );

  // Company filter options
  const companyFilterOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Tüm Firmalar" },
      ...companies.map(c => ({ value: String(c.id), label: c.name })),
    ],
    [companies],
  );

  // ComboBox options — filtered by selected company
  const personOptions: ComboBoxOption[] = useMemo(
    () =>
      people
        .filter((p) => {
          if (!p.isActive) return false;
          if (existingPersonIds.has(p.id)) return false;
          // Company filter
          if (selectedCompanyId && p.companyId !== Number(selectedCompanyId)) return false;
          return true;
        })
        .map((p) => ({
          value: p.id,
          label: `${p.fullName}${p.title || p.companyName ? " — " : ""}${[p.title, p.companyName].filter(Boolean).join(" / ")}`,
        })),
    [people, existingPersonIds, selectedCompanyId],
  );

  // Selected person details
  const selectedPerson = useMemo(
    () => (selectedPersonId ? people.find((p) => p.id === selectedPersonId) : null),
    [selectedPersonId, people],
  );

  // Company options for quick-add modal
  const companyOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Firma seçiniz (opsiyonel)" },
      ...companies.map(c => ({ value: String(c.id), label: c.name })),
    ],
    [companies],
  );

  /* ── When company filter changes, clear selected person if not matching ── */

  useEffect(() => {
    if (selectedCompanyId && selectedPerson) {
      if (selectedPerson.companyId !== Number(selectedCompanyId)) {
        setSelectedPersonId(null);
      }
    }
  }, [selectedCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Submit ──────────────────────────────────── */

  async function handleSubmit() {
    if (!selectedPersonId) {
      setError("Lütfen bir kişi seçiniz.");
      return;
    }
    setError("");
    await onSubmit({
      personId: selectedPersonId,
      role,
    });
    // Reset
    setSelectedPersonId(null);
    setRole("ATTENDEE");
    setSelectedCompanyId("");
  }

  /* ── Quick-add person ────────────────────────── */

  const handleQuickAddSave = useCallback(() => {
    if (!quickName.trim()) return;
    const companyId = quickCompanyId ? Number(quickCompanyId) : null;
    const companyName = companyId
      ? companies.find(c => c.id === companyId)?.name
      : undefined;
    const newPerson: Person = {
      id: Date.now(),
      fullName: quickName.trim(),
      email: quickEmail.trim(),
      title: quickTitle.trim(),
      phone: "",
      companyId,
      companyName,
      isActive: quickActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  }, [quickName, quickEmail, quickTitle, quickCompanyId, quickActive, companies]);

  return (
    <>
      <div className="space-y-4">
        {/* ── Company filter + Person selector + Role ──── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_160px]">
          <Select
            label="Firma Filtrele"
            options={companyFilterOptions}
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setError("");
            }}
            disabled={isLoading}
          />

          <ComboBox
            label="Kişi Seçiniz"
            placeholder={selectedCompanyId
              ? `${companies.find(c => c.id === Number(selectedCompanyId))?.name ?? "Firma"} çalışanları...`
              : "Aramak için yazmaya başlayın..."
            }
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

        {/* ── Company filter hint ──────────────────── */}
        {selectedCompanyId && (
          <div className="flex items-center gap-2 rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>{companies.find(c => c.id === Number(selectedCompanyId))?.name}</strong> firmasına ait{" "}
              <strong>{personOptions.length}</strong> kişi listeleniyor.
            </span>
            <button
              type="button"
              onClick={() => setSelectedCompanyId("")}
              className="ml-auto text-brand-500 underline hover:text-brand-700 dark:hover:text-brand-200"
            >
              Filtreyi kaldır
            </button>
          </div>
        )}

        {/* ── Selected person preview ─────────────── */}
        {selectedPerson && (
          <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950/20">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {selectedPerson.fullName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate dark:text-surface-50">
                {selectedPerson.fullName}
              </p>
              <p className="text-xs text-surface-500 truncate dark:text-surface-400">
                {[selectedPerson.title, selectedPerson.companyName, selectedPerson.email]
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
