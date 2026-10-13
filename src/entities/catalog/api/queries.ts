/**
 * Katalog sorguları — kişiler, firmalar, projeler, yerler, kategoriler, unvanlar.
 *
 * Aynı anahtarı kullanan tüm bileşenler TEK önbelleği paylaşır: 40 not satırı aynı anda
 * `usePersons()` çağırsa bile ağa yalnızca bir istek gider (deduplication).
 */
import { useQuery } from "@tanstack/react-query";
import { catalogKeys } from "@/shared/api/queryKeys";
import { STALE } from "@/shared/api/queryClient";
import {
  fetchPersons, fetchCompanies, fetchProjects, fetchLocations, fetchCategories, fetchTitles,
} from "@/services/catalogService";

export function usePersons() {
  return useQuery({ queryKey: catalogKeys.persons(), queryFn: fetchPersons, staleTime: STALE.catalog });
}

export function useCompanies() {
  return useQuery({ queryKey: catalogKeys.companies(), queryFn: fetchCompanies, staleTime: STALE.catalog });
}

export function useProjects() {
  return useQuery({ queryKey: catalogKeys.projects(), queryFn: fetchProjects, staleTime: STALE.catalog });
}

export function useLocations() {
  return useQuery({ queryKey: catalogKeys.locations(), queryFn: fetchLocations, staleTime: STALE.catalog });
}

export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories(), queryFn: fetchCategories, staleTime: STALE.catalog });
}

export function useTitles() {
  return useQuery({ queryKey: catalogKeys.titles(), queryFn: fetchTitles, staleTime: STALE.catalog });
}
