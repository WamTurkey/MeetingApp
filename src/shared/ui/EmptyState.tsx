import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  /** Ana başlık. `message` ile eşdeğerdir — ikisinden biri verilmelidir. */
  title?: string;
  /** Kısa kullanım: `<EmptyState message="Kayıt bulunamadı" />` */
  message?: string;
  description?: string;
  action?: ReactNode;
  /** Tablo / panel içi kullanım için daha küçük boşluk ve ikon */
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState — Boş liste / arama sonucu / tablo durumları için genel bileşen.
 * Tablolarda `<tr><td colSpan={n}><EmptyState compact message="..." /></td></tr>` şeklinde kullanılabilir.
 */
export function EmptyState({
  icon,
  title,
  message,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const heading = title ?? message ?? "Gösterilecek kayıt bulunamadı";

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center animate-fade-in-up",
        compact ? "py-8" : "py-16",
        className,
      )}
    >
      <div
        className={cn(
          "relative mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200/70 text-surface-400 ring-1 ring-inset ring-surface-200 dark:from-surface-800 dark:to-surface-700/60 dark:text-surface-500 dark:ring-surface-700",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
      >
        <span className={cn("absolute inset-0 rounded-2xl bg-brand-500/5 blur-md")} aria-hidden />
        <span className="relative">
          {icon ?? <Inbox className={compact ? "h-6 w-6" : "h-8 w-8"} />}
        </span>
      </div>
      <h3 className={cn("font-semibold text-fg", compact ? "text-sm" : "text-lg")}>{heading}</h3>
      {description && (
        <p className={cn("mt-1.5 max-w-sm text-fg-muted", compact ? "text-xs" : "text-sm")}>{description}</p>
      )}
      {action && <div className={compact ? "mt-3" : "mt-5"}>{action}</div>}
    </div>
  );
}
