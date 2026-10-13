/**
 * PersonModal — Kişi ekleme/düzenleme modal formu.
 *
 * Alanlar: Ad Soyad, E-posta, Unvan (Select), Telefon, Firma (Select), Aktiflik
 */
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { UserPlus, Save } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { useCreatePerson, useUpdatePerson } from "@/entities/catalog/api/mutations";
import type { UserListDto } from "@/services/userService";
import { useTitles } from "@/entities/catalog/api/queries";
import { useUsers } from "@/entities/user/api/queries";
import type { PersonDto, CompanyDto, TitleDto } from "@/types/api";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingPerson: PersonDto | null;
  companies: CompanyDto[];
}

export function PersonModal({ isOpen, onClose, onSaved, editingPerson, companies }: PersonModalProps) {
  const isEdit = !!editingPerson;
  const { mutateAsync: createPerson } = useCreatePerson();
  const { mutateAsync: updatePerson } = useUpdatePerson();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [titleId, setTitleId] = useState<string>("");  // title as select
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [linkedUserId, setLinkedUserId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Load titles from API
  const titlesQuery = useTitles();
  // Kararlı referans: önbellek değişmedikçe aynı dizi → aşağıdaki form-doldurma effect'i gereksiz tetiklenmez
  const titles: TitleDto[] = useMemo(() => titlesQuery.data ?? [], [titlesQuery.data]);

  // Load system users (for Person ↔ User linking)
  const usersQuery = useUsers({ enabled: isOpen });
  const users: UserListDto[] = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editingPerson) {
      setFullName(editingPerson.fullName);
      setEmail(editingPerson.email ?? "");
      // Match title text to a title ID
      const matchingTitle = titles.find(t => t.name === editingPerson.title);
      setTitleId(matchingTitle ? String(matchingTitle.id) : "");
      setPhone(editingPerson.phone ?? "");
      setCompanyId(editingPerson.companyId ? String(editingPerson.companyId) : "");
      setIsActive(editingPerson.isActive);
      setLinkedUserId(editingPerson.linkedUserId ? String(editingPerson.linkedUserId) : "");
    } else if (isOpen) {
      setFullName(""); setEmail(""); setTitleId(""); setPhone(""); setCompanyId(""); setIsActive(true);
      setLinkedUserId("");
    }
    setError("");
  }, [isOpen, editingPerson, titles]);

  const companyOptions = useMemo(() => [
    { value: "", label: "Firma seçiniz (opsiyonel)" },
    ...companies.filter(c => c.isActive).map(c => ({ value: String(c.id), label: c.name })),
  ], [companies]);

  // Sadece başka bir kişiye bağlı OLMAYAN kullanıcılar (veya bu kişiye bağlı olan) listelenir
  const userOptions = useMemo(() => [
    { value: "", label: "Bağlı kullanıcı yok" },
    ...users
      .filter(u => u.linkedPersonId == null || u.linkedPersonId === editingPerson?.id)
      .map(u => ({ value: String(u.id), label: `${u.fullName} (${u.email})` })),
  ], [users, editingPerson]);

  const titleOptions = useMemo(() => [
    { value: "", label: "Unvan seçiniz (opsiyonel)" },
    ...titles.filter(t => t.isActive).map(t => ({ value: String(t.id), label: t.name })),
  ], [titles]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError("Ad Soyad alanı zorunludur."); return; }

    setIsSaving(true);
    setError("");

    // Resolve title name from ID
    const selectedTitle = titleId ? titles.find(t => t.id === Number(titleId))?.name : undefined;

    try {
      if (isEdit && editingPerson) {
        await updatePerson({ id: editingPerson.id, dto: {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          title: selectedTitle || undefined,
          phone: phone.trim() || undefined,
          companyId: companyId ? Number(companyId) : undefined,
          isActive,
          linkedUserId: linkedUserId ? Number(linkedUserId) : undefined,
        } });
      } else {
        await createPerson({
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          title: selectedTitle || undefined,
          phone: phone.trim() || undefined,
          companyId: companyId ? Number(companyId) : undefined,
          linkedUserId: linkedUserId ? Number(linkedUserId) : undefined,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Kişi Düzenle" : "Yeni Kişi Ekle"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Ad Soyad *"
          placeholder="Örn: Fatma Şahin"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={error && !fullName.trim() ? error : undefined}
          autoFocus
          disabled={isSaving}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Unvan / Görev"
            options={titleOptions}
            value={titleId}
            onChange={(e) => setTitleId(e.target.value)}
            disabled={isSaving}
          />
          <Select
            label="Firma"
            options={companyOptions}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="E-posta"
            type="email"
            placeholder="ornek@sirket.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
          />
          <Input
            label="Telefon"
            type="tel"
            placeholder="+90 5XX XXX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {users.length > 0 && (
          <Select
            label="Bağlı Sistem Kullanıcısı"
            options={userOptions}
            value={linkedUserId}
            onChange={(e) => setLinkedUserId(e.target.value)}
            disabled={isSaving}
          />
        )}

        {isEdit && (
          <Checkbox
            label="Aktif kişi"
            description="Pasif kişiler dropdown listelerinde görünmez."
            checked={isActive}
            onChange={setIsActive}
            disabled={isSaving}
          />
        )}

        {error && fullName.trim() && (
          <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-950/30 dark:text-danger-300" role="alert">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            icon={isEdit ? <Save className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          >
            {isEdit ? "Değişiklikleri Kaydet" : "Kişiyi Kaydet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
