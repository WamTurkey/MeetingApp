/**
 * CatalogModal — nested modal for managing catalog definitions.
 *
 * Shows a form to add new items + a table of existing items below.
 * When a new item is created, calls `onCreated(id)` so the parent
 * form's dropdown auto-selects the new entry.
 */
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Checkbox } from "@/shared/ui/Checkbox";
import { useCatalog, type CatalogKind } from "../hooks/useCatalog";

export interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: CatalogKind;
  /** Called with the new item's ID after creation */
  onCreated?: (id: number) => void;
}

export function CatalogModal({
  isOpen,
  onClose,
  kind,
  onCreated,
}: CatalogModalProps) {
  const { items, fields, label, create, remove } = useCatalog(kind);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  function resetForm() {
    setFormData({});
    setActive(true);
    setError("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nameField = fields.find((f) => f.key === "name");
    if (!formData.name?.trim()) {
      setError(`${nameField?.label?.replace(" *", "") || "Ad"} alanı zorunludur`);
      return;
    }
    const newItem = create({ ...formData, active });
    onCreated?.(newItem.id);
    resetForm();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${label} Yönetimi`}
      description={`Yeni ${label.toLowerCase()} ekleyin veya mevcut kayıtları yönetin.`}
      size="xl"
    >
      <div className="space-y-6">
        {/* ── Add Form ────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900/50"
        >
          <h3 className="mb-3 text-sm font-semibold text-surface-700 dark:text-surface-300">
            <Plus className="mr-1.5 inline-block h-4 w-4" />
            Yeni {label} Ekle
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                value={formData[field.key] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Checkbox
              label="Aktif kayıtlarda göster"
              checked={active}
              onChange={setActive}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
            >
              Kaydet
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-danger-600" role="alert">
              {error}
            </p>
          )}
        </form>

        {/* ── Existing Items Table ────────────────── */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
            Mevcut Kayıtlar ({items.length})
          </h3>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-surface-400">
              Henüz kayıt yok
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 dark:bg-surface-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-surface-500 dark:text-surface-400">
                      Ad
                    </th>
                    {fields.length > 1 && (
                      <th className="px-3 py-2 text-left font-medium text-surface-500 dark:text-surface-400">
                        {fields[1]?.label?.replace(" *", "") ?? ""}
                      </th>
                    )}
                    <th className="px-3 py-2 text-center font-medium text-surface-500 dark:text-surface-400">
                      Durum
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-surface-500 dark:text-surface-400">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white dark:bg-surface-800"
                    >
                      <td className="px-3 py-2 text-surface-900 dark:text-surface-100">
                        {item.name}
                      </td>
                      {fields.length > 1 && (
                        <td className="px-3 py-2 text-surface-500 dark:text-surface-400">
                          {((item as unknown as Record<string, string>)[fields[1]?.key ?? ""] ?? "—")}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.active
                              ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                              : "bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400"
                          }`}
                        >
                          {item.active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="rounded-md p-1 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
