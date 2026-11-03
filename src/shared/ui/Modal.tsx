/**
 * Modal — Portal-based dialog with ModalStack support for nested modals.
 *
 * Features:
 * - Renders via React Portal to document.body
 * - Auto z-index stacking via ModalStack context
 * - ESC only closes the topmost modal
 * - Body scroll lock while any modal is open
 * - Focus management
 */
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useModalStack } from "@/shared/lib/modal-stack";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showClose?: boolean;
  className?: string;
  headerActions?: ReactNode;
  /** Kaydırılan gövdenin dışında, panel altına sabitlenen aksiyon alanı */
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  className,
  headerActions,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { isTop, zIndex } = useModalStack(isOpen);

  // ESC — only close topmost
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTop) onClose();
    },
    [onClose, isTop],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Only restore scroll if no other modals are open
      if (!document.querySelector('[data-modal-overlay]')) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, handleKeyDown]);

  // Focus panel on open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center md:items-center md:p-4"
      style={{ zIndex }}
    >
      {/* Overlay */}
      <div
        data-modal-overlay
        className="absolute inset-0 bg-surface-950/50 backdrop-blur-sm animate-fade-in dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — mobile bottom sheet, desktop centered dialog */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-desc" : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex w-full min-h-0 max-h-[min(92dvh,100%)] flex-col overflow-hidden bg-white shadow-2xl",
          "rounded-t-[24px] border-x-0 border-b-0 border-t border-border",
          "md:max-h-[92vh] md:rounded-2xl md:border",
          "dark:border-white/10 dark:bg-slate-950",
          "animate-fade-in-up md:animate-scale-in",
          size === "sm" && "md:max-w-sm",
          size === "md" && "md:max-w-md",
          size === "lg" && "md:max-w-lg",
          size === "xl" && "md:max-w-xl",
          size === "2xl" && "md:max-w-2xl",
          className,
        )}
      >
        {/* Header */}
        {(title || showClose || headerActions) && (
          <div className="relative z-20 flex shrink-0 items-start justify-between border-b border-surface-100 px-6 py-4 dark:border-surface-700">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-fg dark:text-surface-50"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-desc"
                  className="mt-1 text-sm text-fg-muted dark:text-surface-400"
                >
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {headerActions}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4",
            !footer && "pb-[max(1rem,env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="relative z-30 shrink-0 border-t border-surface-200 bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-surface-700 dark:bg-surface-900">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
