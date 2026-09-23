import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { APP_NAME } from "@/shared/config/constants";
import { NOTE_TYPE_LABEL } from "@/shared/config/constants";
import { MeetingStatusBadge } from "@/entities/meeting/ui/MeetingStatusBadge";
import { MOCK_MEETINGS } from "@/entities/meeting/mock";
import { MOCK_NOTES } from "@/entities/note/mock";
import { MOCK_PARTICIPANTS } from "@/entities/participant/mock";
import { PARTICIPANT_ROLE_LABEL } from "@/entities/participant/model";
import { NOTE_TYPE_BADGE_VARIANT } from "@/entities/note/constants";

export function MinutesPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const meetingId = Number(id);

  const meeting = MOCK_MEETINGS.find((m) => m.id === meetingId);
  const notes = MOCK_NOTES.filter((n) => n.meeting_id === meetingId);
  const participants = MOCK_PARTICIPANTS.filter((p) => p.meeting_id === meetingId);

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-surface-500">Toplantı bulunamadı.</p>
        <Link to="/meetings" className="mt-4 text-brand-600 hover:underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  const decisions = notes.filter((n) => n.type === "DECISION");
  const tasks = notes.filter((n) => n.type === "TASK");
  const infoNotes = notes.filter((n) => n.type === "INFO" || n.type === "NOTE");

  return (
    <div className="space-y-6">
      {/* Toolbar - hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <Link to={`/meetings/${meetingId}`}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Detaya Dön
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          icon={<Printer className="h-4 w-4" />}
          onClick={() => window.print()}
        >
          Yazdır
        </Button>
      </div>

      {/* Printable document */}
      <div className="mx-auto max-w-3xl rounded-xl border border-surface-200 bg-white p-8 shadow-card print:border-none print:shadow-none print:p-0 dark:border-surface-700 dark:bg-surface-800">

        {/* ── Header: Toplantı Bilgileri (tablo formatında) ────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              {APP_NAME}
            </h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>

          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <td className="py-2.5 pr-4 font-semibold text-surface-600 dark:text-surface-400 whitespace-nowrap w-40">
                  Toplantının Konusu
                </td>
                <td className="py-2.5 text-surface-900 dark:text-surface-50 font-bold text-lg">
                  {meeting.title}
                </td>
              </tr>
              {meeting.location_name && (
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <td className="py-2.5 pr-4 font-semibold text-surface-600 dark:text-surface-400 whitespace-nowrap">
                    Toplantı Yeri
                  </td>
                  <td className="py-2.5 text-surface-900 dark:text-surface-50">
                    {meeting.location_name}
                  </td>
                </tr>
              )}
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <td className="py-2.5 pr-4 font-semibold text-surface-600 dark:text-surface-400 whitespace-nowrap">
                  Gün ve Saat
                </td>
                <td className="py-2.5 text-surface-900 dark:text-surface-50">
                  {formatDate(meeting.meeting_date, "weekday")}
                  {meeting.planned_start ? ` — ${meeting.planned_start}` : ""}
                </td>
              </tr>
            </tbody>
          </table>

          {meeting.description && (
            <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
              {meeting.description}
            </p>
          )}

          <div className="mt-4 h-0.5 bg-brand-600 rounded-full" />
        </div>

        {/* ── Katılımcılar ────────────────────────────────────── */}
        {participants.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Katılımcılar
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="py-2 text-left font-medium text-surface-600 dark:text-surface-400">Ad Soyad</th>
                  <th className="py-2 text-left font-medium text-surface-600 dark:text-surface-400">Unvan</th>
                  <th className="py-2 text-left font-medium text-surface-600 dark:text-surface-400">Rol</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-surface-100 dark:border-surface-700/50">
                    <td className="py-2 text-surface-900 dark:text-surface-50">{p.name}</td>
                    <td className="py-2 text-surface-600 dark:text-surface-400">{p.title}</td>
                    <td className="py-2">{PARTICIPANT_ROLE_LABEL[p.role]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Toplantı Gündemi ────────────────────────────────── */}
        <section className="mb-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
            Toplantı Gündemi
          </h3>
          {meeting.description ? (
            <p className="text-sm text-surface-800 dark:text-surface-200">
              {meeting.description}
            </p>
          ) : (
            <p className="text-sm text-surface-400 italic">Gündem bilgisi girilmemiş.</p>
          )}
        </section>

        {/* ── Alınan Kararlar ─────────────────────────────────── */}
        <section className="mb-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-600">
            Alınan Kararlar ({decisions.length})
          </h3>
          {decisions.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2">
              {decisions.map((n) => (
                <li key={n.id} className="text-sm text-surface-800 dark:text-surface-200">
                  {n.content}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-surface-400 italic">Henüz karar kaydedilmemiş.</p>
          )}
        </section>

        {/* ── Görevler ────────────────────────────────────────── */}
        {tasks.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-warning-600">
              Görevler ({tasks.length})
            </h3>
            <ul className="space-y-2">
              {tasks.map((n) => (
                <li key={n.id} className="flex items-start gap-2 text-sm text-surface-800 dark:text-surface-200">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded border border-surface-300" />
                  <span>
                    {n.content}
                    {n.responsible_person_name && (
                      <span className="text-surface-500"> — Sorumlu: {n.responsible_person_name}</span>
                    )}
                    {n.due_date && (
                      <span className="text-surface-500"> · Termin: {formatDate(n.due_date, "short")}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Önemli Notlar & Bilgiler ─────────────────────── */}
        {infoNotes.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
              Önemli Notlar ({infoNotes.length})
            </h3>
            <div className="space-y-3">
              {infoNotes.map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <Badge variant={NOTE_TYPE_BADGE_VARIANT[n.type]} size="sm">
                    {NOTE_TYPE_LABEL[n.type]}
                  </Badge>
                  <p className="flex-1 text-sm text-surface-800 dark:text-surface-200">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Bir Sonraki Toplantı ─────────────────────────── */}
        <section className="mb-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
            Bir Sonraki Toplantı
          </h3>
          {meeting.next_meeting_at ? (
            <div className="text-sm text-surface-800 dark:text-surface-200">
              <p>Tarih: {formatDateTime(meeting.next_meeting_at)}</p>
              {meeting.next_meeting_note && <p className="mt-1">{meeting.next_meeting_note}</p>}
            </div>
          ) : meeting.following && meeting.following.length > 0 ? (
            <div className="text-sm text-surface-800 dark:text-surface-200 space-y-1">
              {meeting.following.map((f) => (
                <p key={f.id}>#{f.id} · {f.title} — {formatDate(f.meeting_date, "short")}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 italic">Henüz planlanmadı.</p>
          )}
        </section>

        {/* Footer */}
        <div className="mt-12 border-t border-surface-200 pt-4 text-center text-xs text-surface-400 dark:border-surface-700">
          Bu tutanak {APP_NAME} sistemi tarafından otomatik olarak oluşturulmuştur.
        </div>
      </div>
    </div>
  );
}
