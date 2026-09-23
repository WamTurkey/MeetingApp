import { Menu, Moon, Sun } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-surface-700/80 dark:bg-surface-900/80 sm:px-6">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 lg:hidden dark:hover:bg-surface-800"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: theme toggle + user */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
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
            <ParticipantAvatar name={user.fullName} size="sm" />
            <span className="hidden text-sm font-medium text-surface-700 sm:inline dark:text-surface-300">
              {user.fullName}
            </span>
            <LogoutButton onLogout={logout} compact />
          </div>
        )}
      </div>
    </header>
  );
}
