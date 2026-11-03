import { toast } from "sonner";
import { useState, useMemo, useCallback, type ReactNode } from "react";
import {
  Search, Users, Loader2, Plus, Pencil, Trash2, Building2, FolderKanban,
  MapPin, Tag, Award, Mail, Phone, Link2,
} from "lucide-react";
import {
  usePersons, useCompanies, useProjects, useLocations, useCategories, useTitles,
} from "@/entities/catalog/api/queries";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/shared/lib/cn";
import { CatalogModal, type CatalogKind } from "@/features/manage-catalog";
import { PersonModal } from "./PersonModal";
import { CatalogUsageModal, meetingsUsing, type CatalogUsageKind } from "./CatalogUsageModal";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { useDeleteCatalogItem } from "@/entities/catalog/api/mutations";
import type { CatalogEntity } from "@/shared/api/invalidation";
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

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr");
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase("tr");
}

function keepActive<T extends { isActive: boolean }>(items: T[], showArchived: boolean, needle: string) {
  return items.filter(
    (item) => (showArchived || item.isActive) && JSON.stringify(item).toLocaleLowerCase("tr").includes(needle),
  );
}

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("people");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Raw data — ortak katalog önbelleği (dropdown'larla aynı anahtarlar)
  const { mutateAsync: deleteCatalogItem } = useDeleteCatalogItem();
  const personsQ = usePersons();
  const companiesQ = useCompanies();
  const projectsQ = useProjects();
  const locationsQ = useLocations();
  const categoriesQ = useCategories();
  const titlesQ = useTitles();
  const people: PersonDto[] = useMemo(() => personsQ.data ?? [], [personsQ.data]);
  const companies: CompanyDto[] = useMemo(() => companiesQ.data ?? [], [companiesQ.data]);
  const projects: ProjectDto[] = useMemo(() => projectsQ.data ?? [], [projectsQ.data]);
  const locations: LocationDto[] = useMemo(() => locationsQ.data ?? [], [locationsQ.data]);
  const categories: CategoryDto[] = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const titles: TitleDto[] = useMemo(() => titlesQ.data ?? [], [titlesQ.data]);
  const isLoading = [personsQ, companiesQ, projectsQ, locationsQ, categoriesQ, titlesQ].some((q) => q.isPending);
  const [usageTarget, setUsageTarget] = useState<{ kind: CatalogUsageKind; id: number; name: string } | null>(null);
  const usageEnabled = activeTab === "projects" || activeTab === "locations" || activeTab === "categories" || usageTarget !== null;
  const meetingsQuery = useMeetingsList({ pageSize: 1000 }, { enabled: usageEnabled });
  const usageMeetings = meetingsQuery.data?.items ?? [];

  function usageCount(kind: CatalogUsageKind, id: number, name: string) {
    if (!meetingsQuery.isSuccess) return undefined;
    return meetingsUsing(kind, id, name, usageMeetings).length;
  }

  // Modal state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonDto | null>(null);
  const [editingCatalogId, setEditingCatalogId] = useState<number | null>(null);

  // Not: Ekleme / güncelleme / silme sonrası tazeleme mutasyon hook'larında yapılır (elle reload yok)

  // ──────── Delete handlers ────────
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const handleDelete = useCallback(async (id: number) => {
    const label = TAB_LABELS[activeTab];
    if (deletingId !== null) return;
    if (!window.confirm(`Bu ${label.toLowerCase()} kaydını silmek istediğinizden emin misiniz?`)) return;
    setDeletingId(id);
    try {
      const entity: CatalogEntity = activeTab === "people" ? "persons" : activeTab;
      await deleteCatalogItem({ entity, id }); // liste + bağımlı dropdown'lar tazelenir
      toast.success(`${label} silindi`);
    } catch (err) {
        toast.error("İşlem sırasında bir hata oluştu"); console.error("Delete error:", err); }
    finally { setDeletingId(null); }
  }, [activeTab, deleteCatalogItem, deletingId]);

  // ──────── Edit handlers ────────
  const handleEdit = useCallback((id: number) => {
    if (activeTab === "people") {
      const person = people.find(p => p.id === id);
      if (person) { setEditingPerson(person); setShowPersonModal(true); }
    } else {
      setEditingCatalogId(id);
      setShowCatalogModal(true);
    }
  }, [activeTab, people]);

  // ──────── Add handler ────────
  const handleAdd = useCallback(() => {
    if (activeTab === "people") {
      setEditingPerson(null);
      setShowPersonModal(true);
    } else {
      setEditingCatalogId(null);
      setShowCatalogModal(true);
    }
  }, [activeTab]);

  const needle = search.trim().toLocaleLowerCase("tr");
  const visiblePeople = useMemo(() => keepActive(people, showArchived, needle), [people, showArchived, needle]);
  const visibleCompanies = useMemo(() => keepActive(companies, showArchived, needle), [companies, showArchived, needle]);
  const visibleProjects = useMemo(() => keepActive(projects, showArchived, needle), [projects, showArchived, needle]);
  const visibleLocations = useMemo(() => keepActive(locations, showArchived, needle), [locations, showArchived, needle]);
  const visibleCategories = useMemo(() => keepActive(categories, showArchived, needle), [categories, showArchived, needle]);
  const visibleTitles = useMemo(() => keepActive(titles, showArchived, needle), [titles, showArchived, needle]);

  const recordCount = {
    people: visiblePeople.length,
    companies: visibleCompanies.length,
    projects: visibleProjects.length,
    locations: visibleLocations.length,
    categories: visibleCategories.length,
    titles: visibleTitles.length,
  }[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-shell-fg">
            <Users className="mr-2 inline-block h-7 w-7 text-blue-500 dark:text-blue-300" />
            Tanım Tabloları
          </h1>
          <p className="mt-1 text-sm text-shell-muted">Kişi, firma, proje ve diğer tanım kayıtlarını kart görünümünde yönetin.</p>
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
        <span className="ml-auto text-xs text-surface-400">{recordCount} kayıt</span>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-surface-500">Kullanıcılar yükleniyor…</span>
        </div>
      ) : recordCount === 0 ? (
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeTab === "people" && visiblePeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              deleting={deletingId === person.id}
              deleteDisabled={deletingId !== null}
              onEdit={() => handleEdit(person.id)}
              onDelete={() => handleDelete(person.id)}
            />
          ))}
          {activeTab === "companies" && visibleCompanies.map((company) => (
            <DirectoryCard
              key={company.id}
              icon={<Building2 className="h-5 w-5" />}
              title={company.name}
              detail={company.shortName}
              tag={company.firmType === "INTERNAL" ? "İç ekip" : "Dış katılımcı"}
              isActive={company.isActive}
              deleting={deletingId === company.id}
              deleteDisabled={deletingId !== null}
              onEdit={() => handleEdit(company.id)}
              onDelete={() => handleDelete(company.id)}
            />
          ))}
          {activeTab === "projects" && visibleProjects.map((project) => (
            <DirectoryCard
              key={project.id}
              icon={<FolderKanban className="h-5 w-5" />}
              title={project.name}
              detail={project.code ? `Kod · ${project.code}` : null}
              isActive={project.isActive}
              usageCount={usageCount("projects", project.id, project.name)}
              deleting={deletingId === project.id}
              deleteDisabled={deletingId !== null}
              onOpen={() => setUsageTarget({ kind: "projects", id: project.id, name: project.name })}
              onEdit={() => handleEdit(project.id)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
          {activeTab === "locations" && visibleLocations.map((location) => (
            <DirectoryCard
              key={location.id}
              icon={<MapPin className="h-5 w-5" />}
              title={location.name}
              isActive={location.isActive}
              usageCount={usageCount("locations", location.id, location.name)}
              deleting={deletingId === location.id}
              deleteDisabled={deletingId !== null}
              onOpen={() => setUsageTarget({ kind: "locations", id: location.id, name: location.name })}
              onEdit={() => handleEdit(location.id)}
              onDelete={() => handleDelete(location.id)}
            />
          ))}
          {activeTab === "categories" && visibleCategories.map((category) => (
            <DirectoryCard
              key={category.id}
              icon={<Tag className="h-5 w-5" />}
              title={category.name}
              isActive={category.isActive}
              usageCount={usageCount("categories", category.id, category.name)}
              deleting={deletingId === category.id}
              deleteDisabled={deletingId !== null}
              onOpen={() => setUsageTarget({ kind: "categories", id: category.id, name: category.name })}
              onEdit={() => handleEdit(category.id)}
              onDelete={() => handleDelete(category.id)}
            />
          ))}
          {activeTab === "titles" && visibleTitles.map((title) => (
            <DirectoryCard
              key={title.id}
              icon={<Award className="h-5 w-5" />}
              title={title.name}
              isActive={title.isActive}
              deleting={deletingId === title.id}
              deleteDisabled={deletingId !== null}
              onEdit={() => handleEdit(title.id)}
              onDelete={() => handleDelete(title.id)}
            />
          ))}
        </div>
      )}

      {/* Catalog Modal — for Companies, Projects, Locations, Categories */}
      {activeTab !== "people" && activeTab !== "titles" && (
        <CatalogModal
          kind={activeTab as CatalogKind}
          isOpen={showCatalogModal}
          onClose={() => { setShowCatalogModal(false); setEditingCatalogId(null); }}
          onCreated={() => { setShowCatalogModal(false); setEditingCatalogId(null); }}
          editingItemId={editingCatalogId}
        />
      )}

      {/* Catalog Modal — for Titles tab */}
      {activeTab === "titles" && (
        <CatalogModal
          kind="titles"
          isOpen={showCatalogModal}
          onClose={() => { setShowCatalogModal(false); setEditingCatalogId(null); }}
          onCreated={() => { setShowCatalogModal(false); setEditingCatalogId(null); }}
          editingItemId={editingCatalogId}
        />
      )}

      {/* Person Modal — for People tab */}
      <PersonModal
        isOpen={showPersonModal}
        onClose={() => { setShowPersonModal(false); setEditingPerson(null); }}
        onSaved={() => { setShowPersonModal(false); setEditingPerson(null); }}
        editingPerson={editingPerson}
        companies={companies}
      />

      <CatalogUsageModal
        kind={usageTarget?.kind ?? null}
        item={usageTarget}
        isOpen={usageTarget !== null}
        onClose={() => setUsageTarget(null)}
      />
    </div>
  );
}

function PersonCard({
  person,
  deleting,
  deleteDisabled,
  onEdit,
  onDelete,
}: {
  person: PersonDto;
  deleting: boolean;
  deleteDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200/80 bg-white shadow-card transition-shadow duration-200 hover:shadow-elevated dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-semibold tracking-wide text-white shadow-sm"
          aria-hidden
        >
          {initials(person.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-base font-semibold text-surface-900 dark:text-surface-50">
              {person.fullName}
            </h2>
            <Badge variant={person.isActive ? "success" : "default"} size="sm" dot>
              {person.isActive ? "Aktif" : "Arşiv"}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-brand-700 dark:text-brand-300">
            {person.title?.trim() || "Unvan belirtilmedi"}
          </p>
        </div>
      </div>

      <dl className="flex flex-1 flex-col gap-2.5 px-4 pb-4">
        <ContactLine icon={Building2} label="Firma" value={person.companyName} />
        <ContactLine
          icon={Mail}
          label="E-posta"
          value={person.email}
          href={person.email ? `mailto:${person.email}` : undefined}
        />
        <ContactLine
          icon={Phone}
          label="Telefon"
          value={person.phone}
          href={person.phone ? `tel:${person.phone.replace(/\s/g, "")}` : undefined}
        />
      </dl>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-surface-100 px-3 py-2.5 dark:border-surface-700/80">
        {person.linkedUserId ? (
          <span className="inline-flex min-w-0 items-center gap-1 text-2xs font-medium text-surface-400">
            <Link2 className="h-3 w-3 shrink-0" />
            Sistem hesabı bağlı
          </span>
        ) : (
          <span className="text-2xs text-surface-400">Hesap bağlantısı yok</span>
        )}
        <CardActions
          label={person.fullName}
          deleting={deleting}
          deleteDisabled={deleteDisabled}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </footer>
    </article>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  const text = value?.trim() || "";
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-700/80 dark:text-surface-300">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-2xs font-medium uppercase tracking-wide text-surface-400">{label}</dt>
        <dd className="text-sm leading-snug">
          {text && href ? (
            <a
              href={href}
              className="break-all text-surface-700 underline-offset-2 hover:text-brand-600 hover:underline dark:text-surface-200 dark:hover:text-brand-300"
            >
              {text}
            </a>
          ) : (
            <span className={cn("break-words", text ? "text-surface-700 dark:text-surface-200" : "text-surface-400")}>
              {text || "—"}
            </span>
          )}
        </dd>
      </div>
    </div>
  );
}

function DirectoryCard({
  icon,
  title,
  detail,
  tag,
  isActive,
  usageCount,
  deleting,
  deleteDisabled,
  onOpen,
  onEdit,
  onDelete,
}: {
  icon: ReactNode;
  title: string;
  detail?: string | null;
  tag?: string;
  isActive: boolean;
  usageCount?: number;
  deleting: boolean;
  deleteDisabled: boolean;
  onOpen?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-600 dark:bg-surface-700 dark:text-brand-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold leading-snug text-surface-900 dark:text-surface-50">{title}</h2>
          <Badge variant={isActive ? "success" : "default"} size="sm" dot>
            {isActive ? "Aktif" : "Arşiv"}
          </Badge>
        </span>
        {detail?.trim() && (
          <span className="mt-1 block break-words text-sm font-normal text-surface-500 dark:text-surface-400">{detail}</span>
        )}
        {tag && (
          <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            {tag}
          </span>
        )}
        {onOpen && (
          <span className="mt-3 block text-xs font-medium text-surface-500 dark:text-surface-400">
            {usageCount == null
              ? "Toplantılar yükleniyor…"
              : usageCount === 0
                ? "Henüz toplantıda kullanılmadı"
                : `${usageCount} toplantıda kullanıldı`}
          </span>
        )}
      </span>
    </>
  );

  return (
    <article className={cn(
      "flex h-full flex-col rounded-2xl border border-surface-200/80 bg-white shadow-card transition-shadow duration-200 dark:border-surface-700 dark:bg-surface-800",
      onOpen && "hover:border-brand-300 hover:shadow-elevated dark:hover:border-brand-700",
    )}>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full flex-1 items-start gap-3 bg-transparent p-4 text-left font-inherit"
          aria-label={`${title} kaydının kullanıldığı toplantıları göster`}
        >
          {body}
        </button>
      ) : (
        <div className="flex flex-1 items-start gap-3 p-4">{body}</div>
      )}
      <footer className="flex justify-end border-t border-surface-100 px-3 py-2.5 dark:border-surface-700/80">
        <CardActions
          label={title}
          deleting={deleting}
          deleteDisabled={deleteDisabled}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </footer>
    </article>
  );
}

function CardActions({
  label,
  deleting,
  deleteDisabled,
  onEdit,
  onDelete,
}: {
  label: string;
  deleting: boolean;
  deleteDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
        title="Düzenle"
        aria-label={`${label} kaydını düzenle`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteDisabled}
        aria-busy={deleting}
        className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-danger-950/30 dark:hover:text-danger-400"
        title="Sil"
        aria-label={`${label} kaydını sil`}
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
