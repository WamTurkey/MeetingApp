/**
 * AddParticipantForm — person-based participant addition.
 *
 * - Company filter dropdown to narrow person list.
 * - Searchable ComboBox pulling from the active Persons pool.
 * - Auto-fills person data (name, email, title, company) on selection.
 * - Outputs a clean { meeting_id, person_id, role } payload.
 */
import { useState, useEffect, useMemo } from "react";
import { UserPlus, Building2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { ComboBox, type ComboBoxOption } from "@/shared/ui/ComboBox";
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
  onSubmit: (data: ParticipantCreatePayload[]) => void | Promise<void>;
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
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const [role, setRole] = useState<ParticipantRole>("ATTENDEE");
  const [error, setError] = useState("");

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
          if (selectedPersonIds.includes(p.id)) return false;
          // Company filter
          if (selectedCompanyId && p.companyId !== Number(selectedCompanyId)) return false;
          return true;
        })
        .map((p) => ({
          value: p.id,
          label: `${p.fullName}${p.title || p.companyName ? " — " : ""}${[p.title, p.companyName].filter(Boolean).join(" / ")}`,
        })),
    [people, existingPersonIds, selectedPersonIds, selectedCompanyId],
  );

  // Selected person details
  const selectedPersons = useMemo(
    () => people.filter((p) => selectedPersonIds.includes(p.id)),
    [selectedPersonIds, people],
  );

  /* ── Submit ──────────────────────────────────── */

  async function handleSubmit() {
    if (selectedPersonIds.length === 0) {
      setError("Lütfen en az bir kişi seçiniz.");
      return;
    }
    setError("");
    const payloads = selectedPersonIds.map(id => ({
      personId: id,
      role,
    }));
    // Note: the payload type expects meetingId but we are passing just {personId, role} matching MeetingDetailPage.
    // Wait, ParticipantCreatePayload has meetingId. Let's add it.
    await onSubmit(payloads.map(p => ({ ...p, meetingId: _meetingId })));
    
    // Reset
    setSelectedPersonIds([]);
    setRole("ATTENDEE");
    setSelectedCompanyId("");
  }

  return (
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
            value={null}
            onChange={(val) => {
              if (val) {
                setSelectedPersonIds((prev) => [...prev, val]);
                setError("");
              }
            }}
            options={personOptions}
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

      {/* ── Selected persons preview ─────────────── */}
      {selectedPersons.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {selectedPersons.map(person => (
            <div key={person.id} className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {person.fullName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate dark:text-surface-50">
                  {person.fullName}
                </p>
                <p className="text-xs text-surface-500 truncate dark:text-surface-400">
                  {[person.title, person.companyName, person.email]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPersonIds(prev => prev.filter(id => id !== person.id))}
                className="rounded p-1 text-surface-400 hover:bg-surface-200 hover:text-danger-600 dark:hover:bg-surface-700"
                title="Kaldır"
              >
                <UserPlus className="hidden" /> {/* just to import UserPlus if it was only used below, wait X is not imported, let's use standard text or X icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))}
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
  );
}
