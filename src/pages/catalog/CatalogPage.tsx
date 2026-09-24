import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Settings2, Loader2 } from "lucide-react";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Badge } from "@/shared/ui/Badge";
import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/shared/lib/cn";
import { CatalogModal, type CatalogKind } from "@/features/manage-catalog";
import { fetchPersons, fetchCompanies, fetchProjects, fetchLocations, fetchCategories } from "@/services/catalogService";
import type { PersonDto, CompanyDto, ProjectDto, LocationDto, CategoryDto } from "@/types/api";

const TABS: { key: CatalogKind | "people"; label: string }[] = [
  { key: "people", label: "Kişiler" },
  { key: "companies", label: "Firmalar" },
  { key: "projects", label: "Projeler" },
  { key: "locations", label: "Toplantı Yerleri" },
  { key: "categories", label: "Kategoriler" },
];

type CatalogRow = {
  id: number;
  primary: string;
  secondary: string;
  tertiary: string;
  isActive: boolean;
};

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogKind | "people">("people");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Raw data
  const [people, setPeople] = useState<PersonDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [p, co, pr, lo, ca] = await Promise.all([
        fetchPersons(), fetchCompanies(), fetchProjects(), fetchLocations(), fetchCategories(),
      ]);
      setPeople(p); setCompanies(co); setProjects(pr); setLocations(lo); setCategories(ca);
    } catch (err) { console.error("[Catalog] Load error:", err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const rows: CatalogRow[] = useMemo(() => {
    const needle = search.toLowerCase();

    function filterActive<T extends { isActive: boolean }>(items: T[]): T[] {
      return items.filter((i) => (showArchived || i.isActive) && JSON.stringify(i).toLowerCase().includes(needle));
    }

    switch (activeTab) {
      case "people": return filterActive(people).map((p) => ({ id: p.id, primary: p.fullName, secondary: `${p.companyName ?? "—"} · ${p.title}`, tertiary: p.email ?? '', isActive: p.isActive }));
      case "companies": return filterActive(companies).map((c) => ({ id: c.id, primary: c.name, secondary: c.shortName ?? "", tertiary: "", isActive: c.isActive }));
      case "projects": return filterActive(projects).map((p) => ({ id: p.id, primary: p.name, secondary: p.code ?? "", tertiary: "", isActive: p.isActive }));
      case "locations": return filterActive(locations).map((l) => ({ id: l.id, primary: l.name, secondary: "", tertiary: "", isActive: l.isActive }));
      case "categories": return filterActive(categories).map((c) => ({ id: c.id, primary: c.name, secondary: "", tertiary: "", isActive: c.isActive }));
    }
  }, [activeTab, search, showArchived, people, companies, projects, locations, categories]);

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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.key ? "bg-white text-brand-700 shadow-sm dark:bg-surface-700 dark:text-brand-400" : "text-surface-500 hover:text-surface-700 dark:text-surface-400")}>
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
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Katalog yükleniyor…</span>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="Kayıt bulunamadı" description="Aramanıza uygun sonuç yok." icon={<Search className="h-8 w-8" />} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Ad</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Detay</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Ek Bilgi</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50/50 dark:border-surface-800 dark:hover:bg-surface-800/50">
                  <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-50">{row.primary}</td>
                  <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{row.secondary || "—"}</td>
                  <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{row.tertiary || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.isActive ? "success" : "default"} size="sm">{row.isActive ? "Aktif" : "Arşiv"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 text-center text-xs text-surface-400">{rows.length} kayıt gösteriliyor</div>
        </div>
      )}

      {/* Catalog Modal for add/edit */}
      {activeTab !== "people" && (
        <CatalogModal
          kind={activeTab as CatalogKind}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadAll(); }}
        />
      )}
    </div>
  );
}
