import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, CalendarClock, Calendar,
  ClipboardCheck, Search, BarChart3, Users, Settings,
  X, PanelLeftClose, PanelLeftOpen, ShieldCheck,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";
import type { UserRole } from "@/entities/user/model";

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
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
    title: null,
    items: [
      { to: "/", icon: LayoutDashboard, label: "Gösterge Paneli", end: true },
    ],
  },
  {
    title: "Toplantılar",
    items: [
      { to: "/meetings", icon: CalendarDays, label: "Toplantılar", end: false },
      { to: "/planned", icon: CalendarClock, label: "Planlı Toplantılar", end: false },
      { to: "/calendar", icon: Calendar, label: "Takvim", end: false },
    ],
  },
  {
    title: "Takip",
    items: [
      { to: "/followups", icon: ClipboardCheck, label: "Takip ve Terminler", end: false },
      { to: "/search", icon: Search, label: "Tüm Belgelerde Ara", end: false },
      { to: "/reports", icon: BarChart3, label: "Genel Rapor", end: false },
    ],
  },
  {
    title: "Yönetim",
    items: [
      { to: "/catalog", icon: Users, label: "Kişiler ve Tanımlar", end: false, roles: ["Admin", "CatalogManager"] },
      { to: "/user-management", icon: ShieldCheck, label: "Kullanıcı Yönetimi", end: false, roles: ["Admin"] },
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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-200 bg-white transition-all duration-300 ease-in-out dark:border-surface-700 dark:bg-surface-900",
          "lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
          // Mobile always shows expanded
          "w-64",
        )}
      >
        {/* ── Logo Header ──────────────────────────── */}
        <div className="flex h-16 items-center justify-between border-b border-surface-100 px-3 dark:border-surface-800">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200",
              "hover:bg-surface-50 active:scale-[0.97] dark:hover:bg-surface-800",
              isCollapsed && "lg:justify-center lg:px-0",
            )}
            title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          >
            {/* Logo */}
            <div className={cn(
              "flex items-center transition-all duration-200 overflow-hidden",
              isCollapsed ? "w-9 h-9 justify-center" : "w-40 h-9"
            )}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className={cn(
                  "h-6 max-w-none transition-all duration-200 dark:brightness-0 dark:invert",
                  isCollapsed ? "object-left object-cover w-7" : "object-contain w-auto"
                )}
              />
            </div>
          </button>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 lg:hidden dark:hover:bg-surface-800"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop collapse indicator */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors dark:hover:bg-surface-800 dark:hover:text-surface-300",
              isCollapsed && "lg:hidden",
            )}
            title={isCollapsed ? "Genişlet" : "Daralt"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
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
                  <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 transition-opacity duration-200">
                    {section.title}
                  </p>
                )}
                {section.title && isCollapsed && (
                  <div className="mx-auto mb-2 hidden h-px w-8 bg-surface-200 lg:block dark:bg-surface-700" />
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
                          "group flex items-center rounded-xl text-sm font-medium transition-all duration-150",
                          isCollapsed
                            ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5"
                            : "gap-3 px-3 py-2.5",
                          isActive
                            ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:text-brand-400"
                            : "text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200",
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
        <div className="border-t border-surface-100 px-3 py-3 dark:border-surface-800">
          <p className={cn(
            "text-center text-2xs text-surface-400 transition-all duration-200",
            isCollapsed ? "lg:hidden" : "",
          )}>
            v1.0.0 — Kurumsal Toplantı Yönetimi
          </p>
          {isCollapsed && (
            <p className="hidden lg:block text-center text-2xs text-surface-400">v1.0</p>
          )}
        </div>
      </aside>
    </>
  );
}
