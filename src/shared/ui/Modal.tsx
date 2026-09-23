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
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  className,
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
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {/* Overlay */}
      <div
        data-modal-overlay
        className="absolute inset-0 bg-surface-950/50 backdrop-blur-sm animate-fade-in dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-desc" : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-2xl border border-border bg-bg-card shadow-2xl animate-scale-in",
          "dark:border-surface-700 dark:bg-surface-800",
          "max-h-[90vh] flex flex-col",
          sizeClasses[size],
          className,
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex shrink-0 items-start justify-between border-b border-surface-100 px-6 py-4 dark:border-surface-700">
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
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
