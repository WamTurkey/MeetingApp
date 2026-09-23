import { useState, useMemo } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Select } from "@/shared/ui/Select";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardContent } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/formatDate";
import { ACTION_STATUS_LABEL } from "@/shared/config/constants";
import { MOCK_FOLLOWUPS } from "@/entities/followup/mock";

const PERIODS = [
  { value: "ALL", label: "Tümü" },
  { value: "DAY", label: "Günlük" },
  { value: "WEEK", label: "Haftalık" },
  { value: "MONTH", label: "Aylık" },
];

const SCOPES = [
  { value: "ALL", label: "Tüm Maddeler" },
  { value: "TRACKED", label: "Takipteki Maddeler" },
];

export function ReportsPage() {
  const [period, setPeriod] = useState("ALL");
  const [scope, setScope] = useState("ALL");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const needle = search.toLowerCase();
    return MOCK_FOLLOWUPS.filter((f) => {
      if (scope === "TRACKED" && f.status === "DONE") return false;
      if (needle && !f.text.toLowerCase().includes(needle) && !(f.responsible_person_name ?? "").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [scope, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Genel Rapor</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Firma, işler, sorumlular ve terminler. Günlük, haftalık, aylık veya tüm kayıtlar.</p>
        </div>
        <Button variant="primary" icon={<Download className="h-4 w-4" />}>Excel İndir (.xlsx)</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">Dönem</label>
              <Select options={PERIODS} value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">Kapsam</label>
              <Select options={SCOPES} value={scope} onChange={(e) => setScope(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">Arama</label>
              <SearchBar placeholder="Konu veya sorumlu…" value={search} onChange={setSearch} />
            </div>
            <Button variant="outline" icon={<Filter className="h-4 w-4" />} onClick={() => { setPeriod("ALL"); setScope("ALL"); setSearch(""); }}>Temizle</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Toplam Madde", value: rows.length, color: "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50" },
          { label: "Açık", value: rows.filter((r) => r.status === "OPEN").length, color: "text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-950/50" },
          { label: "Sürüyor", value: rows.filter((r) => r.status === "IN_PROGRESS").length, color: "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50" },
          { label: "Tamamlanan", value: rows.filter((r) => r.status === "DONE").length, color: "text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-950/50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
            <p className="text-xs text-surface-500 dark:text-surface-400">{stat.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", stat.color.split(" ")[0])}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Report table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Konu</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Sorumlu</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Kaynak Toplantı</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Termin</th>
                <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50/50 dark:border-surface-800 dark:hover:bg-surface-800/50">
                  <td className="max-w-xs px-4 py-3 font-medium text-surface-900 truncate dark:text-surface-50">{row.text}</td>
                  <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{row.responsible_person_name ?? "—"}</td>
                  <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{row.source_meeting_title ?? "—"}</td>
                  <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{row.due_date ? formatDate(row.due_date, "short") : "—"}</td>
                  <td className="px-4 py-3"><Badge variant={row.status === "DONE" ? "success" : row.status === "IN_PROGRESS" ? "warning" : "default"} size="sm">{ACTION_STATUS_LABEL[row.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardContent>
          <p className="text-center text-xs text-surface-400">{rows.length} madde gösteriliyor</p>
        </CardContent>
      </Card>
    </div>
  );
}
