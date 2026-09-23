/**
 * Zod validation schema for the Create Meeting form.
 *
 * Handles conditional validation (planned_start only required when
 * has_planned_start is true, next_meeting_at only when has_next_meeting
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
    meeting_date: z.string().min(1, "Toplantı tarihi gereklidir"),

    // Conditional: planned start time
    has_planned_start: z.boolean().default(false),
    planned_start: z.string().nullable().default(null),

    // Catalog FK references
    category_id: z.coerce.number().nullable().default(null),
    project_id: z.coerce.number().nullable().default(null),
    company_id: z.coerce.number().nullable().default(null),
    location_id: z.coerce.number().nullable().default(null),

    // Conditional: next meeting
    has_next_meeting: z.boolean().default(false),
    next_meeting_date: z.string().nullable().default(null),
    next_meeting_time: z.string().nullable().default(null),
    next_meeting_note: z.string().default(""),

    // Previous meeting link
    previous_meeting_id: z.coerce.number().nullable().default(null),
    relation_type: z.enum(["FOLLOW_UP", "CONTINUATION"]).default("FOLLOW_UP"),
    copy_participants: z.boolean().default(true),
    copy_open_tasks: z.boolean().default(true),
  })
  .refine(
    (d) =>
      !d.has_planned_start ||
      (d.planned_start != null && d.planned_start.length > 0),
    {
      message: "Saat belirle seçildiyse planlanan saat zorunludur",
      path: ["planned_start"],
    },
  )
  .refine(
    (d) =>
      !d.has_next_meeting ||
      (d.next_meeting_date != null && d.next_meeting_date.length > 0),
    {
      message: "Sonraki toplantı tarihi gereklidir",
      path: ["next_meeting_date"],
    },
  );

export type CreateMeetingFormData = z.infer<typeof createMeetingSchema>;

/**
 * Convert validated form data into the API-ready MeetingCreatePayload.
 */
export function toMeetingPayload(data: CreateMeetingFormData) {
  const nextAt =
    data.has_next_meeting && data.next_meeting_date
      ? data.next_meeting_time
        ? `${data.next_meeting_date}T${data.next_meeting_time}`
        : data.next_meeting_date
      : null;

  return {
    title: data.title,
    subject: data.subject || undefined,
    meeting_date: data.meeting_date,
    planned_start: data.has_planned_start ? data.planned_start : null,
    category_id: data.category_id || null,
    project_id: data.project_id || null,
    company_id: data.company_id || null,
    location_id: data.location_id || null,
    next_meeting_at: nextAt,
    next_meeting_note: data.next_meeting_note || undefined,
    previous_meeting_id: data.previous_meeting_id || null,
    relation_type: data.previous_meeting_id ? data.relation_type : undefined,
    copy_participants:
      data.previous_meeting_id ? data.copy_participants : false,
    copy_open_tasks: data.previous_meeting_id ? data.copy_open_tasks : false,
  };
}
