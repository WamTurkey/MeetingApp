import { fetchMeetingById } from "@/services/meetingService";
import {
  buildMeetingChain,
  missingNeighborIds,
  toChainNode,
  type MeetingChainNode,
} from "../model/chain";

const MAX_CHAIN_FETCHES = 40;

/** Seçilen toplantıdan PARENT/CHILD bağlarıyla tüm zincir düğümlerini kronolojik sırada döner. */
export async function resolveMeetingChain(startId: number): Promise<MeetingChainNode[]> {
  const byId = new Map<number, MeetingChainNode>();
  const seed = await fetchMeetingById(startId);
  byId.set(seed.id, toChainNode(seed));

  let missing = missingNeighborIds(byId);
  let fetches = 0;

  while (missing.length > 0 && fetches < MAX_CHAIN_FETCHES) {
    for (const id of missing) {
      if (fetches >= MAX_CHAIN_FETCHES) break;
      const detail = await fetchMeetingById(id);
      byId.set(detail.id, toChainNode(detail));
      fetches += 1;
    }
    missing = missingNeighborIds(byId);
  }

  return buildMeetingChain(startId, byId).nodes;
}

/** Seçilen toplantıdan PARENT/CHILD bağlarıyla tüm zincir kimliklerini kronolojik sırada döner. */
export async function resolveMeetingChainIds(startId: number): Promise<number[]> {
  const nodes = await resolveMeetingChain(startId);
  return nodes.map((node) => node.id);
}
