/**
 * Navigasyon geçmişi yardımcıları.
 *
 * Desen (bkz. navigation_and_modal_state_audit.md):
 * - Detay sayfasına giden her link `state: { from }` taşır  → `useNavFrom()`
 * - Detay sayfasının "Geri" butonu `useSmartBack()` kullanır:
 *     from varsa  → navigate(-1)  (tarayıcı geri tuşu ile birebir aynı; URL'deki modal/filtre durumu geri gelir)
 *     from yoksa  → fallback rotası (doğrudan link / yeni sekme ile açılmışsa uygulamadan çıkarmaz)
 * - Sayfa içi kalıcı durum (açık modal, sekme, filtre) URL'de tutulur → `useUrlParams()`
 */
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export interface NavFrom {
  pathname: string;
  search: string;
  /** Geri butonunda gösterilecek etiket (ör. "Takip ve Terminler") */
  label: string;
}

export interface NavState {
  from?: NavFrom;
}

/** Rota → kullanıcıya gösterilen sayfa adı (etiket verilmezse kullanılır) */
const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/meetings": "Toplantılar",
  "/planned": "Planlı Toplantılar",
  "/calendar": "Takvim",
  "/search": "Arama",
  "/followups": "Takip ve Terminler",
  "/reports": "Raporlar",
};

function isNavFrom(value: unknown): value is NavFrom {
  const v = value as Partial<NavFrom> | null | undefined;
  return !!v && typeof v.pathname === "string" && typeof v.label === "string";
}

/** Mevcut konumu "geldiği yer" olarak paketler — `<Link state>` / `navigate(to, { state })` için. */
export function useNavFrom(label?: string): NavState {
  const { pathname, search } = useLocation();
  return useMemo(
    () => ({ from: { pathname, search, label: label ?? ROUTE_LABELS[pathname] ?? "Geri" } }),
    [pathname, search, label],
  );
}

/**
 * Akıllı geri: uygulama içinden gelindiyse gerçek geri (history -1), aksi halde fallback rotası.
 * `label` geri butonunda gösterilir: "Takip ve Terminler", "Takvim", "Toplantılar"…
 */
export function useSmartBack(fallback: string, fallbackLabel: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const raw = (location.state as NavState | null)?.from;
  const from = isNavFrom(raw) ? raw : undefined;

  const goBack = useCallback(() => {
    if (from) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [from, navigate, fallback]);

  return { goBack, label: from?.label ?? fallbackLabel, hasOrigin: !!from };
}

/**
 * URL query parametrelerini sayfa durumu olarak kullanır.
 * Güncellemeler `replace` ile yapılır (history şişmez) ve mevcut `location.state` (ör. `from`) korunur.
 * Birden fazla parametre aynı anda `update({ a, b })` ile değiştirilmelidir (art arda çağrılar birbirini ezer).
 */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const update = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true, state: location.state },
      );
    },
    [setSearchParams, location.state],
  );

  return { params: searchParams, update };
}

/** "12", "K-00012", "k12" → 12 · geçersizse null */
export function parseItemCode(value: string | null): number | null {
  if (!value) return null;
  const match = /^(?:k-?)?0*(\d+)$/i.exec(value.trim());
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
