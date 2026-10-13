import { QueryClient } from "@tanstack/react-query";

/** Tekrar denemenin anlamsız olduğu HTTP durumları (istemci hatası / yetki) */
const NON_RETRYABLE = new Set([400, 401, 403, 404, 409, 422]);

/** Veri tiplerine göre tazelik süreleri — hook'larda `staleTime` olarak kullanılır */
export const STALE = {
  /** Aktif çalışılan ekran (toplantı detayı) */
  detail: 10_000,
  /** Sık değişen listeler (toplantılar, takip maddeleri) */
  list: 30_000,
  /** Seyrek değişen katalog verisi — mutasyonlarda zaten invalidate edilir */
  catalog: 5 * 60_000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.list,
      gcTime: 10 * 60_000,
      // Sekmeye dönüşte arka planda (spinner göstermeden) yalnızca bayat veriyi yeniler
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && NON_RETRYABLE.has(status)) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
