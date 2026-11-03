/**
 * MeetingFilterBar — search field for the meetings list.
 * Status and date range live in MeetingFilterModal.
 */
import { useState, useEffect } from "react";
import { CalendarDays, X } from "lucide-react";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
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

  return (
    <SearchBar
      className="w-full"
      placeholder="Toplantı ara..."
      value={searchInput}
      onChange={setSearchInput}
    />
  );
}

export function hasActiveMeetingFilters(filters: MeetingFilters): boolean {
  return filters.status !== "" || filters.dateFrom !== "" || filters.dateTo !== "";
}

export function MeetingFilterModal({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}: MeetingFilterBarProps & { isOpen: boolean; onClose: () => void }) {
  function handleClear() {
    onFilterChange({ ...filters, status: "", dateFrom: "", dateTo: "" });
  }

  const hasActive = hasActiveMeetingFilters(filters);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtrele" size="sm">
      <div className="space-y-4">
        <Select
          label="Durum"
          options={MEETING_STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as MeetingStatus | "" })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Başlangıç"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
            icon={<CalendarDays className="h-3.5 w-3.5" />}
          />
          <Input
            type="date"
            label="Bitiş"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
          />
        </div>
        {hasActive && (
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
    </Modal>
  );
}
