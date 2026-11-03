import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { ParticipantAvatar } from "@/entities/participant/ui/ParticipantAvatar";
import { Button } from "@/shared/ui/Button";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { resolved, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function openProfile() {
    setMenuOpen(false);
    navigate("/settings");
  }

  return (
    <header className="z-30 mx-3 mt-3 flex h-14 items-center justify-between rounded-3xl border border-slate-900/10 bg-white/50 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:mx-4 sm:px-6">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-full p-2 text-shell-muted hover:bg-black/5 lg:hidden dark:hover:bg-white/10"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img
          src="/logo.png"
          alt="WAM"
          className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
        />
      </div>

      {/* Right: theme toggle + user */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="rounded-full text-shell-fg hover:bg-black/5 hover:text-shell-fg dark:hover:bg-white/10"
          icon={
            resolved === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          }
          aria-label="Tema değiştir"
        />

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 ml-1">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-full outline-none ring-offset-2 ring-offset-transparent focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Profil menüsü"
              >
                <ParticipantAvatar name={user.fullName} size="sm" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-2xl border border-slate-900/10 bg-white/90 p-1 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openProfile}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-shell-fg hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <UserRound className="h-4 w-4" />
                    Profil
                  </button>
                </div>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-shell-fg">
                {user.fullName}
              </span>
              <span className="text-2xs text-shell-muted">
                {user.role === "Admin" ? "Sistem Yöneticisi" : user.role === "CatalogManager" ? "Katalog Yöneticisi" : "Kullanıcı"}
              </span>
            </div>
            <LogoutButton
              onLogout={logout}
              compact
              className="rounded-full text-shell-fg hover:bg-black/5 dark:hover:bg-white/10"
            />
          </div>
        )}
      </div>
    </header>
  );
}
