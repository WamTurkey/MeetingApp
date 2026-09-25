/**
 * ComboBox — searchable dropdown with optional "+ Ekle" button.
 *
 * Uses @floating-ui for positioning. Supports keyboard navigation.
 */
import { useState, useRef, useId, useMemo, useEffect } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size as sizeMiddleware,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import { ChevronDown, Search, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface ComboBoxOption {
  value: number;
  label: string;
  disabled?: boolean;
}

export interface ComboBoxGroup {
  label: string;
  options: ComboBoxOption[];
}

export interface ComboBoxProps {
  label?: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  options: ComboBoxOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Show a "+ Ekle" button at the bottom */
  onAddNew?: () => void;
  addNewLabel?: string;
  className?: string;
  /** Grouped options — if provided, options prop is ignored */
  groups?: ComboBoxGroup[];
}

export function ComboBox({
  label,
  value,
  onChange,
  options,
  placeholder = "Seçin",
  error,
  disabled = false,
  onAddNew,
  addNewLabel = "Yeni Ekle",
  className,
  groups,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const autoId = useId();

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      sizeMiddleware({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  // Flatten all options (from groups or direct)
  const allOptions = useMemo(() => {
    if (groups) return groups.flatMap(g => g.options);
    return options;
  }, [groups, options]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (groups) {
      if (!needle) return groups;
      return groups
        .map(g => ({
          ...g,
          options: g.options.filter(o => o.label.toLowerCase().includes(needle)),
        }))
        .filter(g => g.options.length > 0);
    }
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, groups, search]);

  const selectedLabel = allOptions.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  function handleSelect(val: number) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  function handleAddNew() {
    setOpen(false);
    setSearch("");
    onAddNew?.();
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div
          ref={refs.setReference}
          {...getReferenceProps()}
          id={autoId}
          role="combobox"
          aria-expanded={open}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
            "cursor-pointer select-none",
            error
              ? "border-danger-500"
              : "border-surface-300 hover:border-surface-400 dark:border-surface-600 dark:hover:border-surface-500",
            disabled && "cursor-not-allowed opacity-50",
            "dark:bg-surface-900",
          )}
        >
          <span
            className={cn(
              "flex-1 truncate",
              selectedLabel
                ? "text-surface-900 dark:text-surface-100"
                : "text-surface-400 dark:text-surface-500",
            )}
          >
            {selectedLabel || placeholder}
          </span>
          {selectedLabel && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-surface-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
        {onAddNew && (
          <button
            type="button"
            onClick={handleAddNew}
            disabled={disabled}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-lg border border-dashed px-3 text-sm font-medium transition-colors",
              "border-surface-300 text-brand-600 hover:border-brand-400 hover:bg-brand-50",
              "dark:border-surface-600 dark:text-brand-400 dark:hover:border-brand-500 dark:hover:bg-brand-900/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{addNewLabel}</span>
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger-600 dark:text-danger-400" role="alert">
          {error}
        </p>
      )}
      {open && !disabled && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[100] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-800"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-surface-100 px-3 py-2 dark:border-surface-700">
              <Search className="h-4 w-4 shrink-0 text-surface-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full bg-transparent text-sm text-surface-900 outline-none placeholder:text-surface-400 dark:text-surface-100"
              />
            </div>
            {/* Options */}
            <div className="max-h-48 overflow-y-auto py-1">
              {groups ? (
                // Grouped rendering
                (filtered as ComboBoxGroup[]).length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-surface-400">
                    Sonuç bulunamadı
                  </p>
                ) : (
                  (filtered as ComboBoxGroup[]).map((group) => (
                    <div key={group.label}>
                      <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 select-none">
                        {group.label}
                      </div>
                      {group.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          disabled={opt.disabled}
                          className={cn(
                            "flex w-full items-center px-3 py-2 pl-5 text-left text-sm transition-colors",
                            opt.value === value
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                              : "text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700",
                            opt.disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ))
                )
              ) : (
                // Flat rendering
                (filtered as ComboBoxOption[]).length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-surface-400">
                    Sonuç bulunamadı
                  </p>
                ) : (
                  (filtered as ComboBoxOption[]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      disabled={opt.disabled}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                        opt.value === value
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                          : "text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700",
                        opt.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
