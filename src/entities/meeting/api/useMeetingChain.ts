/**
 * Mevcut toplantı detayındaki PARENT/CHILD bağlarından zinciri kurar.
 * Liste DTO'suna bağ eklenmez; görünmeyen komşular fetchMeetingById ile çekilir.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { meetingKeys } from "@/shared/api/queryKeys";
import { fetchMeetingById } from "@/services/meetingService";
import type { MeetingDetail } from "@/types/api";
import {
  buildMeetingChain,
  missingNeighborIds,
  toChainNode,
  type MeetingChain,
  type MeetingChainNode,
} from "../model/chain";

const MAX_CHAIN_FETCHES = 40;

export function useMeetingChain(seedDetail: MeetingDetail | undefined): {
  chain: MeetingChain | null;
  isLoading: boolean;
  error: string | null;
} {
  const qc = useQueryClient();
  const [extraNodes, setExtraNodes] = useState<MeetingChainNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGen = useRef(0);

  const seedId = seedDetail?.id ?? 0;

  useEffect(() => {
    setExtraNodes([]);
    setError(null);
  }, [seedId]);

  const byId = useMemo(() => {
    const map = new Map<number, MeetingChainNode>();
    if (seedDetail) {
      map.set(seedDetail.id, toChainNode(seedDetail));
    }
    for (const node of extraNodes) {
      map.set(node.id, node);
    }
    return map;
  }, [seedDetail, extraNodes]);

  useEffect(() => {
    if (!seedDetail) return;

    const missing = missingNeighborIds(byId);
    if (missing.length === 0) {
      setIsLoading(false);
      return;
    }
    if (byId.size >= MAX_CHAIN_FETCHES) {
      setIsLoading(false);
      setError("Zincir çok uzun; tüm halkalar yüklenemedi.");
      return;
    }

    const gen = ++fetchGen.current;
    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      try {
        const fetched: MeetingChainNode[] = [];
        for (const id of missing) {
          if (cancelled || fetchGen.current !== gen) return;
          const cached = qc.getQueryData<MeetingDetail>(meetingKeys.detail(id));
          const detail =
            cached ??
            (await qc.fetchQuery({
              queryKey: meetingKeys.detail(id),
              queryFn: () => fetchMeetingById(id),
            }));
          if (!detail) continue;
          fetched.push(toChainNode(detail));
        }
        if (cancelled || fetchGen.current !== gen) return;
        setExtraNodes((current) => {
          const next = new Map(current.map((node) => [node.id, node]));
          for (const node of fetched) next.set(node.id, node);
          return [...next.values()];
        });
      } catch {
        if (!cancelled && fetchGen.current === gen) {
          setError("Zincir toplantıları yüklenirken bir hata oluştu.");
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seedDetail, byId, qc]);

  const chain = useMemo(() => {
    if (!seedDetail) return null;
    if (missingNeighborIds(byId).length > 0 && !error) return null;
    return buildMeetingChain(seedDetail.id, byId);
  }, [seedDetail, byId, error]);

  return {
    chain,
    isLoading: Boolean(seedDetail) && (isLoading || (chain == null && !error)),
    error,
  };
}
