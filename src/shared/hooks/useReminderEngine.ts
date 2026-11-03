import { useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { usePersons } from "@/entities/catalog/api/queries";
import { useFollowups } from "@/entities/followup/api/queries";
import { useMeetingsList } from "@/entities/meeting/api/queries";
import { MAX_PAGE_SIZE } from "@/shared/config/constants";
import {
  ensureNotificationPermission,
  istanbulWallTime,
  scheduleLocalReminder,
} from "@/shared/lib/localReminders";

export function useReminderEngine(): void {
  const { user } = useAuth();
  const meetingsQuery = useMeetingsList({ pageSize: MAX_PAGE_SIZE });
  const followupsQuery = useFollowups();
  const personsQuery = usePersons();

  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  useEffect(() => {
    const meetings = meetingsQuery.data?.items;
    if (!meetings) return;

    for (const meeting of meetings) {
      const startAt = istanbulWallTime(meeting.meetingDate, meeting.plannedStart ?? "09:00");
      const fireAt = new Date(startAt.getTime() - 15 * 60 * 1000);
      scheduleLocalReminder({
        key: `meeting:${meeting.id}:${startAt.toISOString()}`,
        title: "Toplantı hatırlatması",
        body: `${meeting.title} 15 dakika içinde başlıyor.`,
        fireAt,
      });
    }
  }, [meetingsQuery.data]);

  useEffect(() => {
    const followups = followupsQuery.data;
    const persons = personsQuery.data;
    if (!followups || !persons || !user) return;

    for (const item of followups) {
      if (!item.dueDate) continue;
      if (item.actionStatus === "DONE" || item.actionStatus === "CANCELLED") continue;
      const person = persons.find((p) => p.id === item.responsiblePersonId);
      if (!person || person.linkedUserId !== user.id) continue;

      const dueKey = item.dueDate.slice(0, 10);
      scheduleLocalReminder({
        key: `followup:${item.id}:${dueKey}`,
        title: "Karar / aksiyon hatırlatması",
        body: item.text,
        fireAt: istanbulWallTime(dueKey, "09:00"),
      });
    }
  }, [followupsQuery.data, personsQuery.data, user]);
}
