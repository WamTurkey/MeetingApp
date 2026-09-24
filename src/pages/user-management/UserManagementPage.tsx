import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Loader2, Crown, UserCog, User as UserIcon } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Select } from "@/shared/ui/Select";
import { useAuth } from "@/app/providers/AuthProvider";
import { fetchUsers, updateUserRole, type UserListDto } from "@/services/userService";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Sistem Yöneticisi (Admin)" },
  { value: "CatalogManager", label: "Katalog Yöneticisi" },
  { value: "User", label: "Standart Kullanıcı" },
];

const ROLE_CONFIG: Record<string, { label: string; color: "success" | "warning" | "default"; icon: typeof Crown }> = {
  Admin:          { label: "Sistem Yöneticisi",   color: "success",   icon: Crown },
  CatalogManager: { label: "Katalog Yöneticisi", color: "warning", icon: UserCog },
  User:           { label: "Standart Kullanıcı",  color: "default", icon: UserIcon },
};

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try { setIsLoading(true); setUsers(await fetchUsers()); }
    catch (err) { console.error("Users load error:", err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleRoleChange(userId: number, newRole: string) {
    if (userId === currentUser?.id) {
      alert("Kendi rolünüzü değiştiremezsiniz.");
      return;
    }
    setSavingId(userId);
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Rol ataması başarısız.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          <ShieldCheck className="mr-2 inline-block h-7 w-7 text-brand-500" />
          Kullanıcı Yönetimi
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Sistem kullanıcılarını görüntüleyin ve rol atayın. Bu sayfa yalnızca <strong>Admin</strong> rolündeki kullanıcılar tarafından görülebilir.
        </p>
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
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="px-4 py-3 text-left font-medium text-surface-500">Kullanıcı</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500">E-posta</th>
                <th className="px-4 py-3 text-center font-medium text-surface-500 w-20">Durum</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 w-56">Rol Atama</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-3 text-center text-xs text-surface-400">{users.length} kullanıcı</div>
        </div>
      )}
    </div>
  );
}
