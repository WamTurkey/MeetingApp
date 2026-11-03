import type { FollowupItem } from "@/entities/followup/model";
import type { FollowupItemDto, UpdateFollowupRequest } from "@/types/api";

type FollowupLike = FollowupItem | FollowupItemDto;

export function toUpdateFollowupRequest(
  item: FollowupLike,
  patch: Partial<UpdateFollowupRequest> = {},
): UpdateFollowupRequest {
  return {
    text: patch.text ?? item.text,
    topicId: patch.topicId ?? item.topicId ?? undefined,
    responsiblePersonId: patch.responsiblePersonId ?? item.responsiblePersonId ?? undefined,
    responsibleCompanyId: patch.responsibleCompanyId ?? item.responsibleCompanyId ?? undefined,
    dueDate: patch.dueDate !== undefined ? patch.dueDate || undefined : item.dueDate ?? undefined,
    actionStatus: patch.actionStatus ?? item.actionStatus,
    completedOn: patch.completedOn !== undefined ? patch.completedOn || undefined : item.completedOn ?? undefined,
    waitingReason: patch.waitingReason ?? ("waitingReason" in item ? item.waitingReason ?? undefined : undefined),
    developmentNote: patch.developmentNote ?? item.developmentNote ?? undefined,
    dependencyItemIds: patch.dependencyItemIds ?? item.dependencyItemIds ?? [],
    listId: "listId" in patch ? patch.listId ?? null : item.listId ?? null,
    isFlagged: patch.isFlagged ?? item.isFlagged ?? false,
    isUrgent: patch.isUrgent ?? item.isUrgent ?? false,
    linkedFollowupId: patch.linkedFollowupId !== undefined ? patch.linkedFollowupId : item.linkedFollowupId ?? null,
  };
}

export function isFollowupClosed(status: string): boolean {
  return status === "DONE" || status === "CANCELLED" || status === "ROLLED_OVER";
}
