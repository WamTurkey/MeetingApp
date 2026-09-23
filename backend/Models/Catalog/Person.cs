using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Models.Catalog;

public class Person : AuditableEntity
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public int? CompanyId { get; set; }
    public string? Title { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public int? LinkedUserId { get; set; }

    // Navigation — Audit
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }

    // Navigation — Relations
    public Company? Company { get; set; }
    public User? LinkedUser { get; set; }

    // Navigation — Children
    public ICollection<MeetingParticipant> MeetingParticipants { get; set; } = new List<MeetingParticipant>();
    public ICollection<Note> ResponsibleNotes { get; set; } = new List<Note>();
    public ICollection<FollowupItem> ResponsibleFollowups { get; set; } = new List<FollowupItem>();
}
