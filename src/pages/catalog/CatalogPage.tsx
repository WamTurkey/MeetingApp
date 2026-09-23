import { useState, useMemo } from "react";
import { Users, Building2, FolderKanban, MapPin, Tag, Plus, Search, Pencil, Trash2, Archive } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardContent } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { MOCK_PEOPLE } from "@/entities/person/mock";
import { MOCK_COMPANIES } from "@/entities/company/mock";
import { MOCK_PROJECTS } from "@/entities/project/mock";
import { MOCK_LOCATIONS } from "@/entities/location/mock";
import { MOCK_CATEGORIES } from "@/entities/category/mock";

type CatalogTab = "people" | "companies" | "projects" | "locations" | "categories";

const TABS: { key: CatalogTab; label: string; icon: React.ReactNode }[] = [
  { key: "people", label: "Kişiler", icon: <Users className="h-4 w-4" /> },
  { key: "companies", label: "Firmalar", icon: <Building2 className="h-4 w-4" /> },
  { key: "projects", label: "Projeler", icon: <FolderKanban className="h-4 w-4" /> },
  { key: "locations", label: "Toplantı Yerleri", icon: <MapPin className="h-4 w-4" /> },
  { key: "categories", label: "Kategoriler", icon: <Tag className="h-4 w-4" /> },
];

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>("people");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const data = useMemo(() => {
    const needle = search.toLowerCase();
    const filterActive = <T extends { active: boolean }>(items: T[]) =>
      items.filter((i) => (showArchived || i.active) && JSON.stringify(i).toLowerCase().includes(needle));

    switch (activeTab) {
      case "people": return filterActive(MOCK_PEOPLE).map((p) => ({ id: p.id, primary: p.full_name, secondary: `${p.company_name ?? "—"} · ${p.title}`, tertiary: p.email, active: p.active }));
      case "companies": return filterActive(MOCK_COMPANIES).map((c) => ({ id: c.id, primary: c.name, secondary: c.short_name, tertiary: "", active: c.active }));
      case "projects": return filterActive(MOCK_PROJECTS).map((p) => ({ id: p.id, primary: p.name, secondary: p.code, tertiary: "", active: p.active }));
      case "locations": return filterActive(MOCK_LOCATIONS).map((l) => ({ id: l.id, primary: l.name, secondary: "", tertiary: "", active: l.active }));
      case "categories": return filterActive(MOCK_CATEGORIES).map((c) => ({ id: c.id, primary: c.name, secondary: "", tertiary: "", active: c.active }));
    }
  }, [activeTab, search, showArchived]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Kişiler ve Tanımlar</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Bir kez kaydedin; katılımcıları ve bilgilerini sonraki toplantılarda hazır kullanın.</p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(""); }}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
              activeTab === tab.key ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400" : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200")}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <Input placeholder="Kayıtlarda ara…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <label className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 cursor-pointer select-none">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded border-surface-300" />
          Arşivdekileri göster
        </label>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Yeni Kayıt</Button>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <EmptyState title="Kayıt bulunamadı" description="Arama kriterlerinize uygun kayıt yok." icon={<Search className="h-8 w-8" />} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Ad</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Detay</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">İletişim</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Durum</th>
                  <th className="px-4 py-3 text-right font-medium text-surface-500 dark:text-surface-400">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50/50 dark:border-surface-800 dark:hover:bg-surface-800/50">
                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-50">{row.primary}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{row.secondary || "—"}</td>
                    <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{row.tertiary || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.active ? "success" : "default"} size="sm">{row.active ? "Aktif" : "Arşiv"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} aria-label="Düzenle" />
                        <Button variant="ghost" size="sm" icon={<Archive className="h-3.5 w-3.5" />} aria-label="Arşivle" />
                        <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5 text-danger-500" />} aria-label="Sil" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardContent>
            <p className="text-center text-xs text-surface-400">{data.length} kayıt gösteriliyor</p>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Yeni ${TABS.find((t) => t.key === activeTab)?.label ?? "Kayıt"}`} size="md">
        <div className="space-y-4 py-2">
          <Input label="Ad" placeholder="Kayıt adını girin…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>İptal</Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>Kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
