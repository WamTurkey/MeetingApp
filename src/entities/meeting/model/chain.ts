/**
 * Toplantı zinciri — PARENT/CHILD bağlarından türetilen saf fonksiyonlar.
 * Veritabanında chainId kolonu yoktur; kök toplantı kimliği türetilmiş chainId'dir.
 */
import type { MeetingLinkDto } from "@/types/api";

export interface MeetingChainNode {
  id: number;
  title: string;
  meetingDate: string;
  participantCount: number;
  noteCount: number;
  links: MeetingLinkDto[];
}

export interface MeetingChain {
  /** Kök toplantı kimliği (türetilmiş) */
  chainId: number;
  rootId: number;
  nodes: MeetingChainNode[];
}

function parentLink(node: MeetingChainNode): MeetingLinkDto | undefined {
  return node.links.find((link) => link.direction === "PARENT");
}

function childLinks(node: MeetingChainNode): MeetingLinkDto[] {
  return node.links.filter((link) => link.direction === "CHILD");
}

/**
 * Verilen düğümden PARENT yönünde köke çıkar.
 * Ziyaret edilen kimlikler döngüyü keser.
 */
export function walkToRoot(
  startId: number,
  byId: Map<number, MeetingChainNode>,
): number {
  const visited = new Set<number>();
  let currentId = startId;

  while (true) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const node = byId.get(currentId);
    if (!node) break;
    const parent = parentLink(node);
    if (!parent) break;
    currentId = parent.linkedMeetingId;
  }

  return currentId;
}

/**
 * Kökten CHILD yönünde tüm devamları BFS ile toplar.
 */
export function collectDescendants(
  rootId: number,
  byId: Map<number, MeetingChainNode>,
): number[] {
  const ordered: number[] = [];
  const visited = new Set<number>();
  const queue: number[] = [rootId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (id == null || visited.has(id)) continue;
    visited.add(id);
    ordered.push(id);

    const node = byId.get(id);
    if (!node) continue;
    for (const child of childLinks(node)) {
      if (!visited.has(child.linkedMeetingId)) {
        queue.push(child.linkedMeetingId);
      }
    }
  }

  return ordered;
}

/**
 * Bilinen düğümlerden kronolojik zincir üretir.
 * Eksik düğümler (henüz çekilmemiş) atlanır; çağıran tarafın haritayı doldurması gerekir.
 */
export function buildMeetingChain(
  startId: number,
  byId: Map<number, MeetingChainNode>,
): MeetingChain {
  const rootId = walkToRoot(startId, byId);
  const ids = collectDescendants(rootId, byId);
  const nodes = ids
    .map((id) => byId.get(id))
    .filter((node): node is MeetingChainNode => node != null)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate) || a.id - b.id);

  return {
    chainId: rootId,
    rootId,
    nodes,
  };
}

/** Bir MeetingDetail benzeri kayıttan zincir düğümü üretir. */
export function toChainNode(detail: {
  id: number;
  title: string;
  meetingDate: string;
  participants?: readonly unknown[] | null;
  notes?: readonly unknown[] | null;
  linkedMeetings?: MeetingLinkDto[] | null;
}): MeetingChainNode {
  return {
    id: detail.id,
    title: detail.title,
    meetingDate: detail.meetingDate,
    participantCount: detail.participants?.length ?? 0,
    noteCount: detail.notes?.length ?? 0,
    links: detail.linkedMeetings ?? [],
  };
}

/** Haritada henüz olmayan komşu kimliklerini döner. */
export function missingNeighborIds(byId: Map<number, MeetingChainNode>): number[] {
  const missing = new Set<number>();
  for (const node of byId.values()) {
    for (const link of node.links) {
      if (!byId.has(link.linkedMeetingId)) {
        missing.add(link.linkedMeetingId);
      }
    }
  }
  return [...missing];
}
