/**
 * MeetingFilterBar — combined search, status, and date filter controls.
 *
 * Uses global SearchBar component + debounce for search input.
 */
import { useState, useEffect } from "react";
import { CalendarDays, X } from "lucide-react";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { MEETING_STATUS_OPTIONS } from "@/entities/meeting/constants";
import type { MeetingStatus } from "@/shared/config/constants";

export interface MeetingFilters {
  status: MeetingStatus | "";
  search: string;
  dateFrom: string;
  dateTo: string;
}

export interface MeetingFilterBarProps {
  filters: MeetingFilters;
  onFilterChange: (filters: MeetingFilters) => void;
}

export const INITIAL_FILTERS: MeetingFilters = {
  status: "",
  search: "",
  dateFrom: "",
  dateTo: "",
};

export function MeetingFilterBar({
  filters,
  onFilterChange,
}: MeetingFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClear() {
    setSearchInput("");
    onFilterChange(INITIAL_FILTERS);
  }

  const hasActiveFilters =
    filters.status !== "" ||
    filters.search !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      {/* Search — global SearchBar */}
      <div className="flex-1 min-w-[200px]">
        <SearchBar
          placeholder="Toplantı ara..."
          value={searchInput}
          onChange={setSearchInput}
        />
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-44">
        <Select
          options={MEETING_STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as MeetingStatus | "" })}
        />
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <div className="w-36">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
            icon={<CalendarDays className="h-3.5 w-3.5" />}
          />
        </div>
        <span className="text-xs text-surface-400">—</span>
        <div className="w-36">
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          icon={<X className="h-3.5 w-3.5" />}
        >
          Temizle
        </Button>
      )}
    </div>
  );
}
