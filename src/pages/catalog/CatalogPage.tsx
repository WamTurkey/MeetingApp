import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Settings2, Loader2, Plus, Pencil, Trash2, Building2, Users, FolderKanban, MapPin, Tag, Award } from "lucide-react";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/shared/lib/cn";
import { CatalogModal, type CatalogKind } from "@/features/manage-catalog";
import { PersonModal } from "./PersonModal";
import {
  fetchPersons, fetchCompanies, fetchProjects, fetchLocations, fetchCategories,
  deletePerson, deleteCompany, deleteProject, deleteLocation, deleteCategory, deleteTitle,
  fetchTitles,
} from "@/services/catalogService";
import type { PersonDto, CompanyDto, ProjectDto, LocationDto, CategoryDto, TitleDto } from "@/types/api";

type TabKey = "people" | "titles" | CatalogKind;

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "people", label: "Kişiler", icon: <Users className="h-4 w-4" /> },
  { key: "companies", label: "Firmalar", icon: <Building2 className="h-4 w-4" /> },
  { key: "projects", label: "Projeler", icon: <FolderKanban className="h-4 w-4" /> },
  { key: "locations", label: "Toplantı Yerleri", icon: <MapPin className="h-4 w-4" /> },
  { key: "categories", label: "Kategoriler", icon: <Tag className="h-4 w-4" /> },
  { key: "titles", label: "Unvanlar", icon: <Award className="h-4 w-4" /> },
];

const TAB_LABELS: Record<TabKey, string> = {
  people: "Kişi", companies: "Firma", projects: "Proje", locations: "Toplantı Yeri", categories: "Kategori", titles: "Unvan",
};

type CatalogRow = {
  id: number;
  primary: string;
  secondary: string;
  tertiary: string;
  isActive: boolean;
};

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("people");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Raw data
  const [people, setPeople] = useState<PersonDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [titles, setTitles] = useState<TitleDto[]>([]);

  // Modal state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonDto | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [p, co, pr, lo, ca, ti] = await Promise.all([
        fetchPersons(), fetchCompanies(), fetchProjects(), fetchLocations(), fetchCategories(), fetchTitles(),
      ]);
      setPeople(p); setCompanies(co); setProjects(pr); setLocations(lo); setCategories(ca); setTitles(ti);
    } catch (err) { console.error("[Catalog] Load error:", err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ──────── Delete handlers ────────
  const handleDelete = useCallback(async (id: number) => {
    const label = TAB_LABELS[activeTab];
    if (!window.confirm(`Bu ${label.toLowerCase()} kaydını silmek istediğinizden emin misiniz?`)) return;
    try {
      switch (activeTab) {
        case "people": await deletePerson(id); break;
        case "companies": await deleteCompany(id); break;
        case "projects": await deleteProject(id); break;
        case "locations": await deleteLocation(id); break;
        case "categories": await deleteCategory(id); break;
        case "titles": await deleteTitle(id); break;
      }
      await loadAll();
    } catch (err) { console.error("Delete error:", err); }
  }, [activeTab, loadAll]);

  // ──────── Edit handlers ────────
  const handleEdit = useCallback((id: number) => {
    if (activeTab === "people") {
      const person = people.find(p => p.id === id);
      if (person) { setEditingPerson(person); setShowPersonModal(true); }
    } else {
      // For catalog items, open CatalogModal (it has its own list + add form)
      setShowCatalogModal(true);
    }
  }, [activeTab, people]);

  // ──────── Add handler ────────
  const handleAdd = useCallback(() => {
    if (activeTab === "people") {
      setEditingPerson(null);
      setShowPersonModal(true);
    } else {
      setShowCatalogModal(true);
    }
  }, [activeTab]);

  // ──────── Rows ────────
  const rows: CatalogRow[] = useMemo(() => {
    const needle = search.toLowerCase();

    function filterActive<T extends { isActive: boolean }>(items: T[]): T[] {
      return items.filter((i) => (showArchived || i.isActive) && JSON.stringify(i).toLowerCase().includes(needle));
    }

    switch (activeTab) {
      case "people": return filterActive(people).map((p) => ({ id: p.id, primary: p.fullName, secondary: `${p.companyName ?? "—"} · ${p.title ?? "—"}`, tertiary: p.email ?? "", isActive: p.isActive }));
      case "companies": return filterActive(companies).map((c) => ({ id: c.id, primary: c.name, secondary: c.shortName ?? "—", tertiary: "", isActive: c.isActive }));
      case "projects": return filterActive(projects).map((p) => ({ id: p.id, primary: p.name, secondary: p.code ?? "—", tertiary: "", isActive: p.isActive }));
      case "locations": return filterActive(locations).map((l) => ({ id: l.id, primary: l.name, secondary: "", tertiary: "", isActive: l.isActive }));
      case "categories": return filterActive(categories).map((c) => ({ id: c.id, primary: c.name, secondary: "", tertiary: "", isActive: c.isActive }));
      case "titles": return filterActive(titles).map((t) => ({ id: t.id, primary: t.name, secondary: "", tertiary: "", isActive: t.isActive }));
    }
  }, [activeTab, search, showArchived, people, companies, projects, locations, categories]);

  // Column headers per tab
  const columns = useMemo(() => {
    switch (activeTab) {
      case "people": return ["Ad Soyad", "Firma · Unvan", "E-posta"];
      case "companies": return ["Firma Adı", "Kısa Ad", ""];
      case "projects": return ["Proje Adı", "Proje Kodu", ""];
      case "locations": return ["Yer Adı", "", ""];
      case "categories": return ["Kategori Adı", "", ""];
      case "titles": return ["Unvan Adı", "", ""];
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            <Settings2 className="mr-2 inline-block h-7 w-7 text-brand-500" />
            Katalog Yönetimi
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Kişiler, firmalar, projeler ve diğer referans verilerini yönetin.</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleAdd}
        >
          Yeni {TAB_LABELS[activeTab]} Ekle
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.key ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400" : "text-surface-500 hover:text-surface-700 dark:text-surface-400")}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="İsim, kod veya firma ara…" className="sm:max-w-xs" />
        <label className="flex items-center gap-2 text-xs text-surface-500 cursor-pointer">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded border-surface-300" />
          Arşivlenenleri de göster
        </label>
        <span className="ml-auto text-xs text-surface-400">{rows.length} kayıt</span>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Katalog yükleniyor…</span>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Kayıt bulunamadı"
          description={search ? "Aramanıza uygun sonuç yok." : `Henüz ${TAB_LABELS[activeTab].toLowerCase()} kaydı bulunmuyor.`}
          icon={<Search className="h-8 w-8" />}
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
              İlk {TAB_LABELS[activeTab]} Kaydını Oluştur
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                {columns.filter(Boolean).map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">{col}</th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-surface-500 dark:text-surface-400 w-20">Durum</th>
                <th className="px-4 py-3 text-right font-medium text-surface-500 dark:text-surface-400 w-24">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50/50 dark:border-surface-800 dark:hover:bg-surface-800/50">
                  <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-50">{row.primary}</td>
                  {columns[1] && <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{row.secondary || "—"}</td>}
                  {columns[2] && <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{row.tertiary || "—"}</td>}
                  <td className="px-4 py-3 text-center">
                    <Badge variant={row.isActive ? "success" : "default"} size="sm">{row.isActive ? "Aktif" : "Arşiv"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(row.id)}
                        className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                        title="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-950/30 dark:hover:text-danger-400"
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
          <div className="p-3 text-center text-xs text-surface-400">{rows.length} kayıt gösteriliyor</div>
        </div>
      )}

      {/* Catalog Modal — for Companies, Projects, Locations, Categories */}
      {activeTab !== "people" && activeTab !== "titles" && (
        <CatalogModal
          kind={activeTab as CatalogKind}
          isOpen={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
          onCreated={() => { setShowCatalogModal(false); loadAll(); }}
        />
      )}

      {/* Catalog Modal — for Titles tab */}
      {activeTab === "titles" && (
        <CatalogModal
          kind="titles"
          isOpen={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
          onCreated={() => { setShowCatalogModal(false); loadAll(); }}
        />
      )}

      {/* Person Modal — for People tab */}
      <PersonModal
        isOpen={showPersonModal}
        onClose={() => { setShowPersonModal(false); setEditingPerson(null); }}
        onSaved={() => { setShowPersonModal(false); setEditingPerson(null); loadAll(); }}
        editingPerson={editingPerson}
        companies={companies}
      />
    </div>
  );
}
