/**
 * Mutasyon → Invalidation eşleme tablosu (TEK KAYNAK).
 *
 * Her `useMutation` başarılı olduğunda buradaki ilgili fonksiyonu çağırır. Böylece "hangi işlem hangi
 * ekranı tazeler?" sorusunun cevabı tek dosyadadır:
 *
 * | Mutasyon                         | Geçersiz kılınan anahtarlar                                         |
 * |----------------------------------|---------------------------------------------------------------------|
 * | Toplantı oluştur                 | meetings.lists                                                       |
 * | Toplantı güncelle / durum        | meetings.lists · diğer meetings.detail (bağlı toplantılar) · prep · followups.lists |
 * | Toplantı sil                     | meetings.lists · meetings.details · followups.all                    |
 * | Not ekle / güncelle / sil        | meetings.detail(id) · followups.all · meetings.lists                 |
 * | Not sırala                       | meetings.detail(id)                                                  |
 * | Katılımcı ekle / çıkar / katılım | meetings.detail(id) · meetings.lists                                 |
 * | Bağlantı ekle / sil              | meetings.detail(kaynak) · meetings.detail(hedef)                     |
 * | Madde devret (rollover)          | meetings.details · followups.all · meetings.lists                    |
 * | Takip maddesi güncelle           | followups.lists · followups.changelog(id) · meetings.detail(kaynak) · meetings.lists |
 * | Katalog (firma, proje, …)        | catalog.<tür> + bağımlılar (bkz. CATALOG_DEPENDENTS)                 |
 * | Kullanıcı ekle / güncelle / sil  | users.all · catalog.persons                                          |
 *
 * Not: Yalnızca ekranda AKTİF olan sorgular hemen yeniden çekilir; diğerleri "stale" işaretlenir ve
 * bir sonraki görüntülemede arka planda tazelenir. Sekmeler arası yayın `dataSync` tarafından yapılır.
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { catalogKeys, followupKeys, meetingKeys, userKeys } from "./queryKeys";

export type CatalogEntity = "persons" | "companies" | "projects" | "locations" | "categories" | "titles";

/**
 * Toplantı detayını değiştiren tüm mutasyonların ortak anahtarı.
 * Aynı toplantıda birden fazla iyimser mutasyon uçuştayken detay yeniden çekilmez (iyimser değerler
 * ezilmesin) — en son biten mutasyon tazelemeyi yapar.
 */
export const meetingMutationKey = (meetingId: number) => ["meetings", "mutation", meetingId] as const;

const done = (promises: Promise<unknown>[]) => Promise.all(promises).then(() => undefined);

function inv(qc: QueryClient, queryKey: QueryKey) {
  return qc.invalidateQueries({ queryKey });
}

/** Aynı toplantıda başka mutasyon sürmüyorsa detayı (ve prep alt anahtarını) tazeler. */
function invalidateDetailWhenIdle(qc: QueryClient, meetingId: number) {
  if (qc.isMutating({ mutationKey: meetingMutationKey(meetingId) }) > 1) return Promise.resolve();
  return inv(qc, meetingKeys.detail(meetingId));
}

/** `exceptId` dışındaki tüm toplantı detayları (ör. bağlı toplantı kartlarındaki durum/başlık) */
function invalidateOtherDetails(qc: QueryClient, exceptId: number) {
  return qc.invalidateQueries({
    queryKey: meetingKeys.details(),
    predicate: (q) => q.queryKey[2] !== exceptId,
  });
}

/** Katalog türü değiştiğinde ayrıca bayatlayan veriler (isimler başka DTO'larda kopyalanmış durumda) */
const CATALOG_DEPENDENTS: Record<CatalogEntity, readonly QueryKey[]> = {
  persons: [userKeys.all, meetingKeys.details(), followupKeys.lists()],
  companies: [catalogKeys.persons(), meetingKeys.details(), followupKeys.lists()],
  titles: [catalogKeys.persons()],
  projects: [meetingKeys.all],
  locations: [meetingKeys.all],
  categories: [meetingKeys.all],
};

export const catalogKeyFor = (entity: CatalogEntity): QueryKey => catalogKeys[entity]();

export const invalidateAfter = {
  meetingCreated: (qc: QueryClient) => inv(qc, meetingKeys.lists()),

  /** Detay, sunucu yanıtıyla zaten `setQueryData` ile yazılır; burada yalnızca türev ekranlar tazelenir. */
  meetingUpdated: (qc: QueryClient, meetingId: number) =>
    done([
      inv(qc, meetingKeys.lists()),
      inv(qc, meetingKeys.prep(meetingId)),
      invalidateOtherDetails(qc, meetingId),
      inv(qc, followupKeys.lists()),
    ]),

  /** Silinen toplantının detayı yeniden çekilmez (404); aktif değilse önbellekten atılır. */
  meetingDeleted: (qc: QueryClient, meetingId: number) => {
    void qc.cancelQueries({ queryKey: meetingKeys.detail(meetingId) });
    qc.removeQueries({ queryKey: meetingKeys.detail(meetingId), type: "inactive" });
    return done([
      inv(qc, meetingKeys.lists()),
      invalidateOtherDetails(qc, meetingId),
      inv(qc, followupKeys.all),
    ]);
  },

  /** Not ↔ Termin çift yönlü senkron: not değişince Takip & Terminler de tazelenir. */
  notesChanged: (qc: QueryClient, meetingId: number) =>
    done([invalidateDetailWhenIdle(qc, meetingId), inv(qc, followupKeys.all), inv(qc, meetingKeys.lists())]),

  notesReordered: (qc: QueryClient, meetingId: number) => invalidateDetailWhenIdle(qc, meetingId),

  participantsChanged: (qc: QueryClient, meetingId: number) =>
    done([invalidateDetailWhenIdle(qc, meetingId), inv(qc, meetingKeys.lists())]),

  /** Bağlantı iki toplantıyı da etkiler; hedef bilinmiyorsa tüm detaylar tazelenir. */
  linksChanged: (qc: QueryClient, meetingIds?: number[]) =>
    meetingIds?.length
      ? done(meetingIds.map((id) => inv(qc, meetingKeys.detail(id))))
      : inv(qc, meetingKeys.details()),

  itemsRolledOver: (qc: QueryClient) =>
    done([inv(qc, meetingKeys.details()), inv(qc, followupKeys.all), inv(qc, meetingKeys.lists())]),

  followupChanged: (qc: QueryClient, item?: { id: number; sourceMeetingId?: number | null }) =>
    done([
      inv(qc, followupKeys.lists()),
      ...(item ? [inv(qc, followupKeys.changelog(item.id))] : []),
      item?.sourceMeetingId ? inv(qc, meetingKeys.detail(item.sourceMeetingId)) : inv(qc, meetingKeys.details()),
      inv(qc, meetingKeys.lists()),
    ]),

  catalogChanged: (qc: QueryClient, entity: CatalogEntity) =>
    done([inv(qc, catalogKeyFor(entity)), ...CATALOG_DEPENDENTS[entity].map((k) => inv(qc, k))]),

  usersChanged: (qc: QueryClient) => done([inv(qc, userKeys.all), inv(qc, catalogKeys.persons())]),
};
