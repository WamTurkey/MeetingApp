import { useState } from "react";
import { ShieldCheck, Loader2, Crown, UserCog, User as UserIcon, Plus, Pencil, UserX, Link2, Users } from "lucide-react";
import { useUsers } from "@/entities/user/api/queries";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/Badge";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { useAuth } from "@/app/providers/AuthProvider";
import type { UserListDto } from "@/services/userService";
import { useDeleteUser, useUpdateUserRole } from "@/entities/user/api/mutations";
import { AddUserModal, USER_ROLE_OPTIONS as ROLE_OPTIONS } from "./AddUserModal";

const ROLE_CONFIG: Record<string, { label: string; color: "success" | "warning" | "default"; icon: typeof Crown }> = {
  Admin:          { label: "Sistem Yöneticisi",   color: "success",   icon: Crown },
  CatalogManager: { label: "Katalog Yöneticisi", color: "warning", icon: UserCog },
  User:           { label: "Standart Kullanıcı",  color: "default", icon: UserIcon },
};

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const updateRoleMutation = useUpdateUserRole();
  const { mutateAsync: deactivateUser } = useDeleteUser();
  const usersQuery = useUsers();
  const users: UserListDto[] = usersQuery.data ?? [];
  const isLoading = usersQuery.isPending;
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserListDto | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Not: Ekleme / güncelleme / rol / pasife alma sonrası tablo mutasyon hook'larında tazelenir (elle reload yok)

  async function handleRoleChange(userId: number, newRole: string) {
    if (userId === currentUser?.id) {
      toast.warning("Kendi rolünüzü değiştiremezsiniz.");
      return;
    }
    setSavingId(userId);
    // İyimser: rol tabloda anında değişir, hata olursa hook önceki listeye döner ve bildirim gösterir
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
    } catch {
      /* hook geri aldı ve bildirim gösterdi */
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget || isDeactivating) return;
    setIsDeactivating(true);
    try {
      await deactivateUser(deactivateTarget.id); // tablo + kişi kataloğu tazelenir
      toast.success(`${deactivateTarget.fullName} pasife alındı.`);
      setDeactivateTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Kullanıcı pasife alınamadı.");
    } finally {
      setIsDeactivating(false);
    }
  }

  const isModalOpen = showAddModal || editingUser !== null;
  const closeModal = () => { setShowAddModal(false); setEditingUser(null); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            <ShieldCheck className="mr-2 inline-block h-7 w-7 text-brand-500" />
            Kullanıcı Yönetimi
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Sistem kullanıcılarını görüntüleyin ve rol atayın. Bu sayfa yalnızca <strong>Admin</strong> rolündeki kullanıcılar tarafından görülebilir.
          </p>
        </div>
        <Button
          id="add-user-button"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Yeni Kullanıcı Ekle
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-surface-200 bg-surface-50/50 p-4 dark:border-surface-700 dark:bg-surface-800/50">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-surface-500" />
              <Badge variant={cfg.color} size="sm">{cfg.label}</Badge>
              <span className="text-xs text-surface-400">
                {key === "Admin" ? "— Tam erişim + Rol atama" : key === "CatalogManager" ? "— Katalog CRUD + Uygulama" : "— Sadece uygulama"}
              </span>
            </div>
          );
        })}
      </div>

      {/* User table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Kullanıcılar yükleniyor…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            message="Henüz kayıtlı kullanıcı bulunmuyor."
            description="Sisteme erişim vermek için ilk kullanıcıyı oluşturun."
            action={<Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAddModal(true)}>Yeni Kullanıcı Ekle</Button>}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="px-4 py-3 text-left font-bold text-surface-600 dark:text-surface-300">Kullanıcı</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600 dark:text-surface-300">E-posta</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600 dark:text-surface-300">Bağlı Personel</th>
                <th className="px-4 py-3 text-center font-bold text-surface-600 dark:text-surface-300 w-20">Durum</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600 dark:text-surface-300 w-56">Rol Atama</th>
                <th className="px-4 py-3 text-right font-bold text-surface-600 dark:text-surface-300 w-24">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.User!;
                const Icon = cfg.icon;
                const isCurrentUser = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50/50 dark:border-surface-800 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                          {u.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-surface-50">
                            {u.fullName}
                            {isCurrentUser && <span className="ml-2 text-xs text-brand-500">(Siz)</span>}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-surface-400">
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.linkedPersonName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                          <Link2 className="h-3 w-3" />
                          {u.linkedPersonName}
                        </span>
                      ) : (
                        <span className="text-xs italic text-surface-400">Eşleşme yok</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={u.isActive ? "success" : "default"} size="sm">
                        {u.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        options={ROLE_OPTIONS}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isCurrentUser || savingId === u.id}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {savingId === u.id && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
                        <Button
                          id={`edit-user-${u.id}`}
                          variant="ghost"
                          size="icon"
                          title="Düzenle"
                          aria-label={`${u.fullName} kullanıcısını düzenle`}
                          onClick={() => setEditingUser(u)}
                          disabled={savingId === u.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          id={`deactivate-user-${u.id}`}
                          variant="ghost"
                          size="icon"
                          title={isCurrentUser ? "Kendi hesabınızı silemezsiniz" : "Pasife al / Sil"}
                          aria-label={`${u.fullName} kullanıcısını pasife al`}
                          className="text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                          onClick={() => setDeactivateTarget(u)}
                          disabled={isCurrentUser || !u.isActive || savingId === u.id}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-3 text-center text-xs text-surface-400">{users.length} kullanıcı</div>
        </div>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        currentUserId={currentUser?.id}
        onClose={closeModal}
        onCreated={closeModal}
      />

      <ConfirmDialog
        isOpen={deactivateTarget !== null}
        onClose={() => !isDeactivating && setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        isLoading={isDeactivating}
        title="Kullanıcıyı pasife al"
        description={`${deactivateTarget?.fullName ?? ""} sisteme giriş yapamayacak ve katalog kişisi bağlantısı kaldırılacak. Geçmiş kayıtlar (tutanak, not) korunur.`}
        confirmLabel="Pasife Al"
      />
    </div>
  );
}
