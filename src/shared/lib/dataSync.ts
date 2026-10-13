/**
 * dataSync — YALNIZCA sekmeler arası (BroadcastChannel) invalidation köprüsü.
 *
 * Aynı sekme içindeki tazeleme artık tamamen React Query mutasyonlarının `onSuccess` / `onSettled`
 * bloklarında yapılır (bkz. `shared/api/invalidation.ts`). Bu modül yalnızca şunu sağlar:
 *
 * - `apiClient` başarılı her mutasyonda URL'den etkilenen kapsamları (scope) çıkarır ve
 *   `broadcastInvalidation()` ile DİĞER sekmelere duyurur (yerel sekmeye event göndermez).
 * - `QueryProvider` içindeki köprü `subscribeRemoteInvalidation()` ile bu duyuruları dinler ve
 *   kapsamları Query Key'lere çevirip `invalidateQueries` çağırır.
 *   (ör. bir sekmede not eklenince diğer sekmedeki Takip & Terminler listesi yenilenir)
 */
export type DataScope =
  | "meetings"
  | "notes"
  | "followups"
  | "participants"
  | "links"
  | "catalog"
  | "users";

const CHANNEL_NAME = "meeting-app:data-sync";

interface InvalidationMessage {
  scopes: DataScope[];
}

const channel: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

/** Verilen kapsamlardaki verilerin bayatladığını DİĞER sekmelere bildirir. */
export function broadcastInvalidation(scopes: DataScope[]) {
  const unique = Array.from(new Set(scopes));
  if (unique.length === 0 || !channel) return;
  try {
    channel.postMessage({ scopes: unique } satisfies InvalidationMessage);
  } catch {
    /* kanal kapalıysa yok say */
  }
}

/** Diğer sekmelerden gelen invalidation duyurularına abone olur. */
export function subscribeRemoteInvalidation(listener: (scopes: DataScope[]) => void): () => void {
  if (!channel) return () => {};
  const handler = (e: MessageEvent<InvalidationMessage>) => {
    if (e.data?.scopes?.length) listener(e.data.scopes);
  };
  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
}

/**
 * Mutasyon URL'sinden etkilenen veri kapsamlarını çıkarır.
 * Not / termin işlemleri iki yönlü senkronize olduğu için `notes` <-> `followups` birlikte bayatlatılır.
 */
export function scopesForMutation(url: string): DataScope[] {
  const path = (url.split("?")[0] ?? "").toLowerCase();

  if (path.includes("/auth/")) return [];
  if (/\/meetings\/\d+\/notes/.test(path)) return ["notes", "followups", "meetings"];
  if (/\/meetings\/\d+\/participants/.test(path)) return ["participants", "meetings"];
  if (/\/meetings\/\d+\/links/.test(path)) return ["links", "meetings"];
  if (/\/meetings\/\d+\/rollover-items/.test(path)) return ["followups", "notes", "meetings"];
  if (path.includes("/followups")) return ["followups", "notes", "meetings"];
  // Toplantı oluşturma/güncelleme/silme (silme, alt kayıtları da soft-delete eder)
  if (path.includes("/meetings")) return ["meetings", "notes", "followups", "participants", "links"];
  if (path.includes("/users")) return ["users", "catalog"];
  if (/\/(persons|companies|projects|locations|categories|titles)/.test(path)) return ["catalog"];
  return [];
}
