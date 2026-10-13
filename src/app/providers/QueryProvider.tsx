import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/api/queryClient";
import { catalogKeys, followupKeys, meetingKeys, userKeys } from "@/shared/api/queryKeys";
import { subscribeRemoteInvalidation, type DataScope } from "@/shared/lib/dataSync";

/**
 * Sekmeler arası köprü: başka bir sekmede yapılan mutasyonun kapsamı → bu sekmede geçersiz kılınacak anahtarlar.
 *
 * Aynı sekmedeki tazeleme mutasyon hook'larının `onSuccess`/`onSettled` bloklarında yapılır
 * (bkz. `shared/api/invalidation.ts`); bu tablo yalnızca BroadcastChannel ile gelen duyuruları işler.
 */
const SCOPE_TO_KEYS: Record<DataScope, readonly (readonly unknown[])[]> = {
  meetings: [meetingKeys.all],
  notes: [meetingKeys.details()],
  participants: [meetingKeys.details()],
  links: [meetingKeys.details()],
  followups: [followupKeys.all, meetingKeys.details()],
  catalog: [catalogKeys.all, userKeys.all],
  users: [userKeys.all, catalogKeys.persons()],
};

function CrossTabInvalidationBridge() {
  useEffect(
    () =>
      subscribeRemoteInvalidation((scopes) => {
        const seen = new Set<string>();
        for (const scope of scopes) {
          for (const key of SCOPE_TO_KEYS[scope] ?? []) {
            const id = JSON.stringify(key);
            if (seen.has(id)) continue;
            seen.add(id);
            void queryClient.invalidateQueries({ queryKey: key });
          }
        }
      }),
    [],
  );
  return null;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CrossTabInvalidationBridge />
      {children}
    </QueryClientProvider>
  );
}
