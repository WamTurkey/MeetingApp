/**
 * LogoutButton — session termination control.
 *
 * Renders a button that triggers the `onLogout` callback.
 * The parent (AuthProvider / Layout) handles token removal
 * and redirect.
 */
import { LogOut } from "lucide-react";
import { Button } from "@/shared/ui/Button";

export interface LogoutButtonProps {
  onLogout: () => void | Promise<void>;
  isLoading?: boolean;
  /** Compact mode hides the label text, shows only icon. */
  compact?: boolean;
}

export function LogoutButton({
  onLogout,
  isLoading = false,
  compact = false,
}: LogoutButtonProps) {
  return (
    <Button
      variant="ghost"
      size={compact ? "sm" : "md"}
      onClick={onLogout}
      isLoading={isLoading}
      icon={<LogOut className="h-4 w-4" />}
      aria-label="Çıkış Yap"
    >
      {!compact && "Çıkış Yap"}
    </Button>
  );
}
