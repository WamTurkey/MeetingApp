import apiClient from "./apiClient";
import type { AllLookups } from "../types/api";

/**
 * Tüm lookup (referans) tablolarını tek seferde çeker.
 * Sayfa yüklendiğinde bir kez çağrılır ve önbelleğe alınabilir.
 */
export async function fetchAllLookups(): Promise<AllLookups> {
  const { data } = await apiClient.get<AllLookups>("/Lookup");
  return data;
}

// Önbellek mekanizması — lookup verisi nadiren değişir
let cachedLookups: AllLookups | null = null;

export async function getLookups(): Promise<AllLookups> {
  if (!cachedLookups) {
    cachedLookups = await fetchAllLookups();
  }
  return cachedLookups;
}

/** Önbelleği temizler (yeni lookup eklenmişse). */
export function invalidateLookupCache(): void {
  cachedLookups = null;
}
