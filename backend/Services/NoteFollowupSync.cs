using MeetingApp.API.Data;
using Microsoft.EntityFrameworkCore;

namespace MeetingApp.API.Services;

/// <summary>
/// Not (Note) ↔ Takip (FollowupItem) çift yönlü durum senkronizasyonu.
///
/// KURALLAR (tek gerçek kaynak = senkron sonrası iki kayıtta AYNI değer):
///  1. Bir not "takip edilir" ise (termin VEYA sorumlu VEYA tipi TASK) → tam olarak 1 aktif FollowupItem'ı olur.
///  2. Not → Takip: Not kaydedildiğinde metin, sorumlu, termin ve durum takip kaydına yazılır.
///     Normalize edilen durum nota da geri yazılır (not durumu null kalıp takipte "OPEN" görünmez).
///  3. Takip → Not: Takip ekranında termin / durum / sorumlu değiştiğinde kaynak not da güncellenir.
///     (Metin tutanağın parçası olduğu için takipten nota geri yazılmaz.)
///  4. Not artık takip edilmiyorsa (termin + sorumlu kaldırıldı, tip TASK değil) → takip kaydı "CANCELLED" + soft-delete.
///     Not tekrar takip edilir hale gelirse aynı takip kaydı canlandırılır (geçmiş/changelog korunur).
///  5. Not silinirse bağlı takip kaydı da soft-delete edilir.
///  6. Geçersiz/eski durum kodları (CLOSED, COMPLETED, boş) LK_ActionStatus'ta geçerli kodlara eşlenir.
/// </summary>
public static class NoteFollowupSync
{
    public static readonly string[] ValidStatuses = { "OPEN", "IN_PROGRESS", "DONE", "CANCELLED", "ROLLED_OVER" };

    public static bool IsTracked(Note note) =>
        note.DueDate.HasValue || note.ResponsiblePersonId.HasValue || note.NoteType == "TASK";

    public static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "OPEN";
        var s = status.Trim().ToUpperInvariant();
        return s switch
        {
            "COMPLETED" or "CLOSED" => "DONE",
            _ when ValidStatuses.Contains(s) => s,
            _ => "OPEN",
        };
    }

    private static void ApplyCompletion(FollowupItem f)
    {
        if (f.ActionStatus == "DONE") f.CompletedOn ??= DateOnly.FromDateTime(DateTime.Today);
        else f.CompletedOn = null;
    }

    /// <summary>Not → Takip. SaveChanges çağırmaz.</summary>
    public static async Task SyncFromNoteAsync(MeetingDbContext db, Note note, int userId)
    {
        // Soft-delete edilmiş takip kaydını da bul (canlandırma için)
        var followup = await db.FollowupItems
            .IgnoreQueryFilters()
            .Where(f => f.SourceNoteId == note.Id)
            .OrderBy(f => f.IsDeleted) // aktif olan önce
            .FirstOrDefaultAsync();

        if (IsTracked(note))
        {
            var status = NormalizeStatus(note.ActionStatus ?? followup?.ActionStatus);
            if (followup == null)
            {
                followup = new FollowupItem
                {
                    SourceMeetingId = note.MeetingId,
                    SourceNoteId = note.Id,
                    CreatedBy = userId,
                };
                db.FollowupItems.Add(followup);
            }
            else
            {
                if (followup.IsDeleted)
                {
                    followup.IsDeleted = false;
                    followup.DeletedAt = null;
                    followup.DeletedBy = null;
                    if (note.ActionStatus == null) status = "OPEN"; // canlandırılan kayıt iptal durumda kalmasın
                }
                followup.UpdatedBy = userId;
                followup.UpdatedAt = DateTime.UtcNow;
            }

            followup.Text = note.Content ?? string.Empty;
            followup.ResponsiblePersonId = note.ResponsiblePersonId;
            followup.DueDate = note.DueDate;
            followup.ActionStatus = status;
            ApplyCompletion(followup);

            note.ActionStatus = status; // çelişkiyi önle: iki tabloda aynı durum
        }
        else if (followup != null && !followup.IsDeleted)
        {
            followup.ActionStatus = "CANCELLED";
            followup.IsDeleted = true;
            followup.DeletedAt = DateTime.UtcNow;
            followup.DeletedBy = userId;
            note.ActionStatus = null;
        }
    }

    /// <summary>Takip → Not. SaveChanges çağırmaz.</summary>
    public static async Task SyncToNoteAsync(MeetingDbContext db, FollowupItem followup)
    {
        followup.ActionStatus = NormalizeStatus(followup.ActionStatus);
        ApplyCompletion(followup);

        if (!followup.SourceNoteId.HasValue) return;
        var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == followup.SourceNoteId.Value);
        if (note == null) return;

        note.DueDate = followup.DueDate;
        note.ResponsiblePersonId = followup.ResponsiblePersonId;
        note.ActionStatus = followup.ActionStatus;
        note.UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Not silindiğinde bağlı takip kaydını soft-delete eder. SaveChanges çağırmaz.</summary>
    public static async Task CascadeDeleteAsync(MeetingDbContext db, int noteId, int userId)
    {
        var items = await db.FollowupItems.Where(f => f.SourceNoteId == noteId).ToListAsync();
        foreach (var f in items)
        {
            f.IsDeleted = true;
            f.DeletedAt = DateTime.UtcNow;
            f.DeletedBy = userId;
            f.ActionStatus = "CANCELLED";
        }
    }
}
