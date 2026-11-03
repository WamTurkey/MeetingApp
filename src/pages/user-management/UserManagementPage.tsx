import { useMemo, useState } from "react";
import { ShieldCheck, Loader2, Crown, UserCog, User as UserIcon, Plus, Pencil, UserX, Link2, Users, Mail, Filter, X, Building2 } from "lucide-react";
import { useUsers } from "@/entities/user/api/queries";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/Badge";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Modal } from "@/shared/ui/Modal";
import { useAuth } from "@/app/providers/AuthProvider";
import type { UserListDto } from "@/services/userService";
import { useDeleteUser, useUpdateUserRole } from "@/entities/user/api/mutations";
import { AddUserModal, USER_ROLE_OPTIONS as ROLE_OPTIONS } from "./AddUserModal";
import { cn } from "@/shared/lib/cn";

const ROLE_CONFIG: Record<string, { label: string; color: "success" | "warning" | "default"; icon: typeof Crown }> = {
  Admin:          { label: "Sistem Yöneticisi",   color: "success",   icon: Crown },
  CatalogManager: { label: "Katalog Yöneticisi", color: "warning", icon: UserCog },
  User:           { label: "Standart Kullanıcı",  color: "default", icon: UserIcon },
};

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "Tüm roller" },
  ...ROLE_OPTIONS,
];

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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      if (user.companyId != null && user.companyName) {
        map.set(String(user.companyId), user.companyName);
      }
    }
    return [
      { value: "", label: "Tüm şirketler" },
      ...[...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "tr"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [users]);

  const hasActiveFilters = roleFilter !== "" || companyFilter !== "";

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (companyFilter && String(user.companyId ?? "") !== companyFilter) return false;
      if (!needle) return true;
      const haystack = [
        user.fullName,
        user.email,
        user.linkedPersonName,
        user.companyName,
        ROLE_CONFIG[user.role]?.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return haystack.includes(needle);
    });
  }, [users, search, roleFilter, companyFilter]);

  async function handleRoleChange(userId: number, newRole: string) {
    if (userId === currentUser?.id) {
      toast.warning("Kendi rolünüzü değiştiremezsiniz.");
      return;
    }
    setSavingId(userId);
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
      await deactivateUser(deactivateTarget.id);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-shell-fg">
            <ShieldCheck className="mr-2 inline-block h-7 w-7 text-blue-500 dark:text-blue-300" />
            Kullanıcı Rol Yönetimi
          </h1>
          <p className="mt-1 text-sm text-shell-muted">
            Sistem kullanıcılarını kart görünümünde yönetin ve rol atayın. Bu sayfa yalnızca <strong>Admin</strong> rolündeki kullanıcılar tarafından görülebilir.
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Ad, e-posta, personel veya şirket ara…"
          className="sm:max-w-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full text-shell-fg hover:bg-black/5 dark:hover:bg-white/10",
            hasActiveFilters && "ring-2 ring-blue-400 text-shell-fg",
          )}
          icon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters(true)}
          aria-label="Filtrele"
        />
      </div>

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
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          message="Sonuç bulunamadı"
          description="Arama veya filtre kriterlerinize uygun kullanıcı yok."
          action={
            hasActiveFilters || search ? (
              <Button
                size="sm"
                variant="outline"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setCompanyFilter("");
                }}
              >
                Filtreleri temizle
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-right text-xs text-surface-400">
            {filteredUsers.length} / {users.length} kullanıcı
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                isCurrentUser={u.id === currentUser?.id}
                saving={savingId === u.id}
                onRoleChange={(role) => void handleRoleChange(u.id, role)}
                onEdit={() => setEditingUser(u)}
                onDeactivate={() => setDeactivateTarget(u)}
              />
            ))}
          </div>
        </div>
      )}

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

      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Kullanıcı Filtreleri" size="sm">
        <div className="space-y-4">
          {hasActiveFilters && (
            <div className="flex justify-start">
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  setRoleFilter("");
                  setCompanyFilter("");
                }}
              >
                Filtreleri temizle
              </Button>
            </div>
          )}
          <Select
            label="Rol"
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          />
          <Select
            label="Şirket"
            options={companyOptions}
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr");
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase("tr");
}

function UserCard({
  user,
  isCurrentUser,
  saving,
  onRoleChange,
  onEdit,
  onDeactivate,
}: {
  user: UserListDto;
  isCurrentUser: boolean;
  saving: boolean;
  onRoleChange: (role: string) => void;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.User!;
  const Icon = cfg.icon;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card transition-shadow duration-200 hover:shadow-elevated dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-semibold tracking-wide text-white shadow-sm"
          aria-hidden
        >
          {initials(user.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 truncate text-base font-semibold text-surface-900 dark:text-surface-50">
              {user.fullName}
              {isCurrentUser && <span className="ml-2 text-xs font-medium text-brand-500">(Siz)</span>}
            </h2>
            <Badge variant={user.isActive ? "success" : "default"} size="sm" dot>
              {user.isActive ? "Aktif" : "Pasif"}
            </Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-medium text-brand-700 dark:text-brand-300">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {cfg.label}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4">
        <InfoLine icon={Mail} label="E-posta" value={user.email} />
        <InfoLine icon={Link2} label="Bağlı personel" value={user.linkedPersonName || "Eşleşme yok"} muted={!user.linkedPersonName} />
        <InfoLine icon={Building2} label="Şirket" value={user.companyName || "Belirtilmedi"} muted={!user.companyName} />
        <div>
          <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-surface-400">Rol atama</p>
          <Select
            options={ROLE_OPTIONS}
            value={user.role}
            onChange={(event) => onRoleChange(event.target.value)}
            disabled={isCurrentUser || saving}
          />
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-end gap-1 border-t border-surface-100 px-3 py-2.5 dark:border-surface-700/80">
        {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin text-brand-500" />}
        <button
          id={`edit-user-${user.id}`}
          type="button"
          title="Düzenle"
          aria-label={`${user.fullName} kullanıcısını düzenle`}
          onClick={onEdit}
          disabled={saving}
          className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          id={`deactivate-user-${user.id}`}
          type="button"
          title={isCurrentUser ? "Kendi hesabınızı silemezsiniz" : "Pasife al"}
          aria-label={`${user.fullName} kullanıcısını pasife al`}
          onClick={onDeactivate}
          disabled={isCurrentUser || !user.isActive || saving}
          className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-danger-950/30 dark:hover:text-danger-400"
        >
          <UserX className="h-4 w-4" />
        </button>
      </footer>
    </article>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-700/80 dark:text-surface-300">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-medium uppercase tracking-wide text-surface-400">{label}</p>
        <p className={muted ? "break-all text-sm text-surface-400" : "break-all text-sm text-surface-700 dark:text-surface-200"}>
          {value}
        </p>
      </div>
    </div>
  );
}
