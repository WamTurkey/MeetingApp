import { NavLink } from "react-router-dom";
import {
  CalendarDays, Calendar, ClipboardCheck, Users, Settings,
  X, PanelLeftClose, PanelLeftOpen, ShieldCheck,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";
import type { UserRole } from "@/entities/user/model";

interface NavItem {
  to: string;
  icon: typeof CalendarDays;
  label: string;
  end: boolean;
  /** Minimum roles required — undefined = visible to all */
  roles?: UserRole[];
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Toplantılar",
    items: [
      { to: "/meetings", icon: CalendarDays, label: "Toplantılar", end: false },
      { to: "/calendar", icon: Calendar, label: "Takvim", end: false },
    ],
  },
  {
    title: "Takip",
    items: [
      { to: "/followups", icon: ClipboardCheck, label: "Takip ve Terminler", end: false },
    ],
  },
  {
    title: "Yönetim",
    items: [
      { to: "/catalog", icon: Users, label: "Tanım Tabloları", end: false, roles: ["Admin", "CatalogManager"] },
      { to: "/user-management", icon: ShieldCheck, label: "Kullanıcı Rol Yönetimi", end: false, roles: ["Admin"] },
      { to: "/settings", icon: Settings, label: "Ayarlar", end: false },
    ],
  },
];

interface SidebarProps {
  /** Mobile drawer state */
  isOpen: boolean;
  onClose: () => void;
  /** Desktop collapsed state */
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();
  const userRole = user?.role ?? "User";

  // Filter nav items by role
  function isVisible(item: NavItem): boolean {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border border-slate-900/10 bg-white/55 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-white/10 dark:bg-slate-950/55",
          "lg:static lg:my-3 lg:ml-3 lg:h-auto lg:self-stretch lg:rounded-3xl lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
          "w-64",
        )}
      >
        {/* ── Logo Header ──────────────────────────── */}
        <div
          className={cn(
            "flex border-b border-slate-900/10 px-3 dark:border-white/10",
            isCollapsed
              ? "h-auto flex-col items-center gap-2 py-3 lg:h-auto"
              : "h-16 items-center justify-between",
          )}
        >
          <div
            className={cn(
              "flex items-center overflow-hidden",
              isCollapsed ? "h-9 w-9 justify-center" : "h-9 w-40",
            )}
          >
            <img
              src="/logo.png"
              alt="WAM"
              className={cn(
                "h-6 max-w-none dark:brightness-0 dark:invert",
                isCollapsed ? "w-7 object-cover object-left" : "w-auto object-contain",
              )}
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-shell-muted hover:bg-black/5 lg:hidden dark:hover:bg-white/10"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden h-7 w-7 items-center justify-center rounded-lg text-shell-muted transition-colors hover:bg-black/5 hover:text-shell-fg lg:flex dark:hover:bg-white/10"
            aria-label={isCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* ── Navigation ───────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          {NAV_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(isVisible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={si} className={cn(si > 0 && "mt-6")}>
                {section.title && !isCollapsed && (
                  <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-widest text-shell-muted/70 transition-opacity duration-200">
                    {section.title}
                  </p>
                )}
                {section.title && isCollapsed && (
                  <div className="mx-auto mb-2 hidden h-px w-8 bg-slate-900/10 lg:block dark:bg-white/10" />
                )}
                <div className="space-y-1">
                  {visibleItems.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onClose}
                      title={isCollapsed ? label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center rounded-full text-sm font-medium transition-all duration-150",
                          isCollapsed
                            ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5"
                            : "gap-3 px-3 py-2.5",
                          isActive
                            ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] dark:bg-blue-400 dark:text-slate-950"
                            : "text-shell-muted hover:bg-black/5 hover:text-shell-fg dark:hover:bg-white/5",
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span
                        className={cn(
                          "transition-all duration-200 whitespace-nowrap",
                          isCollapsed ? "lg:hidden lg:w-0 lg:opacity-0" : "lg:w-auto lg:opacity-100",
                        )}
                      >
                        {label}
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Footer ───────────────────────────────── */}
        <div className="border-t border-slate-900/10 px-3 py-3 dark:border-white/10">
          <p className={cn(
            "text-center text-2xs text-shell-muted/70 transition-all duration-200",
            isCollapsed ? "lg:hidden" : "",
          )}>
            v1.0.0 — Kurumsal Toplantı Yönetimi
          </p>
          {isCollapsed && (
            <p className="hidden lg:block text-center text-2xs text-shell-muted/70">v1.0</p>
          )}
        </div>
      </aside>
    </>
  );
}
