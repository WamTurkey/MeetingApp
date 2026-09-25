/**
 * CatalogModal — nested modal for managing catalog definitions.
 *
 * Shows a form to add/edit items + a table of existing items below.
 * When a new item is created, calls `onCreated(id)` so the parent
 * form's dropdown auto-selects the new entry.
 */
import { useState, useEffect, type FormEvent } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { toast } from "sonner";
import { Input } from "@/shared/ui/Input";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Select } from "@/shared/ui/Select";
import { useCatalog, type CatalogKind } from "../hooks/useCatalog";

export interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: CatalogKind;
  /** Called with the new item's ID after creation */
  onCreated?: (id: number) => void;
  /** Called after any deletion */
  onDeleted?: () => void;
  /** If provided, the modal opens in edit mode for this item */
  editingItemId?: number | null;
}

export function CatalogModal({
  isOpen,
  onClose,
  kind,
  onCreated,
  onDeleted,
  editingItemId,
}: CatalogModalProps) {
  const { items, fields, label, create, update, remove } = useCatalog(kind);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [active, setActive] = useState(true);
  const [firmType, setFirmType] = useState<"INTERNAL" | "EXTERNAL">("EXTERNAL");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // When editingItemId changes (e.g. from CatalogPage), populate the form
  useEffect(() => {
    if (editingItemId && isOpen) {
      const item = items.find(i => i.id === editingItemId);
      if (item) {
        startEditing(item);
      }
    }
  }, [editingItemId, isOpen, items]);

  function startEditing(item: any) {
    setEditId(item.id);
    const data: Record<string, string> = {};
    for (const field of fields) {
      data[field.key] = (item as any)[field.key] ?? "";
    }
    setFormData(data);
    setActive(item.isActive ?? true);
    if (kind === "companies") {
      setFirmType((item as any).firmType || "EXTERNAL");
    }
    setError("");
  }

  function resetForm() {
    setFormData({});
    setActive(true);
    setFirmType("EXTERNAL");
    setError("");
    setEditId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nameField = fields.find((f) => f.key === "name");
    if (!formData.name?.trim()) {
      setError(`${nameField?.label?.replace(" *", "") || "Ad"} alanı zorunludur`);
      return;
    }
    try {
      const payload: Record<string, string | boolean> = { ...formData, isActive: active };
      if (kind === "companies") payload.firmType = firmType;

      if (editId) {
        // UPDATE mode
        await update(editId, payload);
        toast.success("Kayıt başarıyla güncellendi");
        onCreated?.(editId);
      } else {
        // CREATE mode
        payload.active = active;
        const newItem = await create(payload);
        toast.success("Kayıt başarıyla oluşturuldu");
        if (newItem && typeof newItem === "object" && "id" in newItem) onCreated?.((newItem as any).id);
      }
      resetForm();
    } catch (err: any) {
      toast.error("Kaydedilirken bir hata oluştu");
      setError(err.message || "Kaydedilirken bir hata oluştu.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { resetForm(); onClose(); }}
      title={`${label} Yönetimi`}
      description={`Yeni ${label.toLowerCase()} ekleyin veya mevcut kayıtları yönetin.`}
      size="xl"
    >
      <div className="space-y-6">
        {/* ── Add / Edit Form ────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900/50"
        >
          <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-surface-700 dark:text-surface-300">
            <span className="flex items-center gap-1.5">
              {editId ? <Pencil className="h-4 w-4 text-brand-500" /> : <Plus className="h-4 w-4" />}
              {editId ? `${label} Düzenle` : `Yeni ${label} Ekle`}
            </span>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600 dark:hover:bg-surface-700"
                title="Düzenlemeyi İptal Et"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
          {kind === "companies" && (
            <div className="mt-3">
              <Select
                label="Firma Tipi"
                options={[
                  { value: "EXTERNAL", label: "🤝 Dış Katılımcı" },
                  { value: "INTERNAL", label: "🏢 İç Ekip" },
                ]}
                value={firmType}
                onChange={(e) => setFirmType(e.target.value as "INTERNAL" | "EXTERNAL")}
              />
            </div>
          )}
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
              icon={editId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            >
              {editId ? "Güncelle" : "Kaydet"}
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
                      className={`bg-white dark:bg-surface-800 ${editId === item.id ? "ring-2 ring-brand-500/30 bg-brand-50/30 dark:bg-brand-900/10" : ""}`}
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
                            item.isActive
                              ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                              : "bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400"
                          }`}
                        >
                          {item.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="rounded-md p-1 text-surface-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20"
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await remove(item.id);
                              onDeleted?.();
                            }}
                            className="rounded-md p-1 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
