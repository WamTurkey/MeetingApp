/**
 * Zod validation schema for the Create Meeting form.
 *
 * Handles conditional validation (plannedStart only required when
 * hasPlannedStart is true, next_meeting_at only when hasNextMeeting
 * is true, etc.)
 */
import { z } from "zod";

export const createMeetingSchema = z
  .object({
    // Core fields
    title: z
      .string()
      .min(3, "Başlık en az 3 karakter olmalıdır")
      .max(500, "Başlık en fazla 500 karakter olabilir"),
    subject: z.string().default(""),
    meetingDate: z.string().min(1, "Toplantı tarihi gereklidir"),

    // Conditional: planned start time
    hasPlannedStart: z.boolean().default(false),
    plannedStart: z.string().nullable().default(null),

    // Catalog FK references
    categoryId: z.coerce.number().nullable().default(null),
    projectId: z.coerce.number().nullable().default(null),
    companyId: z.coerce.number().nullable().default(null),
    locationId: z.coerce.number().nullable().default(null),

    // Conditional: next meeting
    hasNextMeeting: z.boolean().default(false),
    nextMeetingDate: z.string().nullable().default(null),
    nextMeetingTime: z.string().nullable().default(null),
    nextMeetingNote: z.string().default(""),

    // Previous meeting link
    previousMeetingId: z.coerce.number().nullable().default(null),
    relationType: z.enum(["FOLLOW_UP", "CONTINUATION"]).default("FOLLOW_UP"),
    copy_participants: z.boolean().default(true),
    copyOpenTasks: z.boolean().default(true),
  })
  .refine(
    (d) =>
      !d.hasPlannedStart ||
      (d.plannedStart != null && d.plannedStart.length > 0),
    {
      message: "Saat belirle seçildiyse planlanan saat zorunludur",
      path: ["plannedStart"],
    },
  )
  .refine(
    (d) =>
      !d.hasNextMeeting ||
      (d.nextMeetingDate != null && d.nextMeetingDate.length > 0),
    {
      message: "Sonraki toplantı tarihi gereklidir",
      path: ["nextMeetingDate"],
    },
  );

export type CreateMeetingFormData = z.infer<typeof createMeetingSchema>;

/**
 * Convert validated form data into the API-ready MeetingCreatePayload.
 */
export function toMeetingPayload(data: CreateMeetingFormData) {
  const nextAt =
    data.hasNextMeeting && data.nextMeetingDate
      ? data.nextMeetingTime
        ? `${data.nextMeetingDate}T${data.nextMeetingTime}`
        : data.nextMeetingDate
      : null;

  return {
    title: data.title,
    subject: data.subject || undefined,
    meetingDate: data.meetingDate,
    plannedStart: data.hasPlannedStart ? data.plannedStart : null,
    categoryId: data.categoryId || null,
    projectId: data.projectId || null,
    companyId: data.companyId || null,
    locationId: data.locationId || null,
    next_meeting_at: nextAt,
    nextMeetingNote: data.nextMeetingNote || undefined,
    previousMeetingId: data.previousMeetingId || null,
    relationType: data.previousMeetingId ? data.relationType : undefined,
    copy_participants:
      data.previousMeetingId ? data.copy_participants : false,
    copyOpenTasks: data.previousMeetingId ? data.copyOpenTasks : false,
  };
}
