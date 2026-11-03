import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ClipboardCheck, Calendar } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface BottomTab {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  isActive: (pathname: string) => boolean;
}

const TABS: BottomTab[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (path) => path === "/",
  },
  {
    to: "/meetings",
    label: "Toplantı",
    icon: CalendarDays,
    isActive: (path) => path.startsWith("/meetings"),
  },
  {
    to: "/followups",
    label: "Termin",
    icon: ClipboardCheck,
    isActive: (path) => path.startsWith("/followups"),
  },
  {
    to: "/calendar",
    label: "Takvim",
    icon: Calendar,
    isActive: (path) => path.startsWith("/calendar"),
  },
];

export function BottomNavigationBar() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-4 z-40 rounded-full border border-slate-900/10 bg-white/75 px-2 py-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_12px_40px_rgba(4,8,22,0.45)] lg:hidden"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
      aria-label="Mobil gezinme"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive(pathname);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "text-shell-fg"
                  : "text-shell-muted/70 hover:text-shell-fg",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  active ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-950" : "bg-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
