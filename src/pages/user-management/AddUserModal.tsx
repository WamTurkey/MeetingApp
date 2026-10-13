/**
 * AddUserModal — Kullanıcı ekleme / düzenleme modalı (yalnızca Admin).
 *
 * Alanlar: Ad Soyad, E-posta, Şifre (yeni kayıtta zorunlu, düzenlemede opsiyonel),
 * Rol (Sistem Yöneticisi / Katalog Yöneticisi / Standart Kullanıcı) ve Bağlı Personel (Katalog → Person).
 */
import { useState, useEffect, useMemo } from "react";
import { UserPlus, Save, Link2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Button } from "@/shared/ui/Button";
import { ComboBox } from "@/shared/ui/ComboBox";
import { toast } from "sonner";
import type { UserListDto } from "@/services/userService";
import { useCreateUser, useUpdateUser } from "@/entities/user/api/mutations";
import { usePersons } from "@/entities/catalog/api/queries";
import type { PersonDto } from "@/types/api";

export const USER_ROLE_OPTIONS = [
  { value: "Admin", label: "Sistem Yöneticisi (Admin)" },
  { value: "CatalogManager", label: "Katalog Yöneticisi" },
  { value: "User", label: "Standart Kullanıcı" },
];

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Verilirse modal "Düzenle" modunda açılır */
  editingUser?: UserListDto | null;
  /** Oturumdaki kullanıcının ID'si — kendi rol/aktifliğini değiştirmesi engellenir */
  currentUserId?: number;
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  linkedPersonId: number | null;
}

const EMPTY_FORM: FormState = {
  fullName: "", email: "", password: "", role: "User", isActive: true, linkedPersonId: null,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddUserModal({ isOpen, onClose, onCreated, editingUser, currentUserId }: AddUserModalProps) {
  const isEdit = !!editingUser;
  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const isSelf = isEdit && editingUser?.id === currentUserId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const personsQuery = usePersons();
  const persons: PersonDto[] = useMemo(() => personsQuery.data ?? [], [personsQuery.data]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setFormData(editingUser ? {
      fullName: editingUser.fullName,
      email: editingUser.email,
      password: "",
      role: editingUser.role,
      isActive: editingUser.isActive,
      linkedPersonId: editingUser.linkedPersonId ?? null,
    } : EMPTY_FORM);
  }, [isOpen, editingUser]);

  // Yalnızca başka bir kullanıcıya bağlı OLMAYAN kişiler (veya zaten bu kullanıcıya bağlı olan) seçilebilir
  const personOptions = useMemo(() => persons
    .filter(p => p.isActive || p.id === formData.linkedPersonId)
    .filter(p => p.linkedUserId == null || p.linkedUserId === editingUser?.id)
    .map(p => ({ value: p.id, label: `${p.fullName}${p.companyName ? ` — ${p.companyName}` : ""}` })),
  [persons, editingUser, formData.linkedPersonId]);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Personel seçildiğinde boş olan Ad Soyad / E-posta alanlarını otomatik doldur
  const handlePersonSelect = (personId: number | null) => {
    const person = persons.find(p => p.id === personId);
    setFormData(prev => ({
      ...prev,
      linkedPersonId: personId,
      fullName: prev.fullName.trim() ? prev.fullName : (person?.fullName ?? prev.fullName),
      email: prev.email.trim() ? prev.email : (person?.email ?? prev.email),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!formData.fullName.trim()) return setError("Ad Soyad zorunludur.");
    if (!formData.email.trim()) return setError("E-posta zorunludur.");
    if (!EMAIL_RE.test(formData.email.trim())) return setError("Geçerli bir e-posta adresi giriniz.");
    if (!isEdit && formData.password.length < 6) return setError("Şifre en az 6 karakter olmalıdır.");
    if (isEdit && formData.password && formData.password.length < 6) return setError("Yeni şifre en az 6 karakter olmalıdır.");

    try {
      setIsSubmitting(true);
      if (isEdit && editingUser) {
        await updateUser({ id: editingUser.id, payload: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          role: formData.role,
          isActive: formData.isActive,
          linkedPersonId: formData.linkedPersonId,
          password: formData.password || null,
        } });
        toast.success("Kullanıcı güncellendi.");
      } else {
        await createUser({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive,
          linkedPersonId: formData.linkedPersonId,
        });
        toast.success("Kullanıcı başarıyla oluşturuldu.");
      }
      onCreated(); // Parent: modalı kapatır (tablo useCreateUser/useUpdateUser ile tazelendi)
    } catch (err: any) {
      setError(err?.response?.data?.message || "İşlem sırasında bir hata meydana geldi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-950/30 dark:text-danger-300" role="alert">
            {error}
          </div>
        )}

        <Input
          id="user-form-fullname"
          label="Ad Soyad *"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          placeholder="Örn: Ahmet Yılmaz"
          disabled={isSubmitting}
          autoFocus
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="user-form-email"
            label="E-posta *"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="ahmet@sirket.com"
            disabled={isSubmitting}
          />
          <Input
            id="user-form-password"
            label={isEdit ? "Yeni Şifre" : "Şifre *"}
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder={isEdit ? "Değiştirmek için doldurun" : "En az 6 karakter"}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>

        <Select
          id="user-form-role"
          label="Rol"
          options={USER_ROLE_OPTIONS}
          value={formData.role}
          onChange={(e) => handleChange("role", e.target.value)}
          disabled={isSubmitting || isSelf}
        />

        <div className="space-y-1.5 rounded-xl border border-dashed border-surface-300 bg-surface-50/60 p-3 dark:border-surface-700 dark:bg-surface-800/40">
          <label className="flex items-center gap-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
            <Link2 className="h-3.5 w-3.5 text-brand-500" />
            Bağlı Personel (Katalog)
          </label>
          <ComboBox
            value={formData.linkedPersonId}
            onChange={handlePersonSelect}
            options={personOptions}
            placeholder="Bir kişi seçin (isteğe bağlı)"
            disabled={isSubmitting}
          />
          <p className="text-xs text-surface-500">
            Kullanıcının görev ve terminlerini kendi hesabından takip edebilmesi için katalogdaki bir kişiyle eşleştirin.
            Başka bir kullanıcıya bağlı kişiler listelenmez.
          </p>
        </div>

        <Checkbox
          label="Hesap Aktif"
          description={isSelf ? "Kendi hesabınızı pasife alamazsınız." : "Pasif kullanıcılar sisteme giriş yapamaz."}
          checked={formData.isActive}
          onChange={(checked) => handleChange("isActive", checked)}
          disabled={isSubmitting || isSelf}
        />

        <div className="flex items-center justify-end gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            id="user-form-submit"
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            icon={isEdit ? <Save className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          >
            {isEdit ? "Değişiklikleri Kaydet" : "Kullanıcı Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
