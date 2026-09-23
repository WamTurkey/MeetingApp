using MeetingApp.API.Models.Catalog;
using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Lookups;

namespace MeetingApp.API.Models.Business;

public class Meeting : AuditableEntity
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Subject { get; set; }
    public DateOnly MeetingDate { get; set; }
    public TimeOnly? PlannedStart { get; set; }
    public string Status { get; set; } = "DRAFT";
    public int Version { get; set; }
    public int? ProjectId { get; set; }
    public int? CompanyId { get; set; }
    public int? LocationId { get; set; }
    public int? CategoryId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime? NextMeetingAt { get; set; }
    public string? NextMeetingNote { get; set; }
    public DateTime? ExcelExportedAt { get; set; }

    // Navigation — Audit
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }

    // Navigation — Lookup
    public LkMeetingStatus StatusNavigation { get; set; } = null!;

    // Navigation — Catalog
    public Project? Project { get; set; }
    public Company? Company { get; set; }
    public Location? Location { get; set; }
    public Category? Category { get; set; }

    // Navigation — Children
    public ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
    public ICollection<MeetingLink> ParentLinks { get; set; } = new List<MeetingLink>();
    public ICollection<MeetingLink> ChildLinks { get; set; } = new List<MeetingLink>();
    public ICollection<FollowupItem> SourceFollowups { get; set; } = new List<FollowupItem>();
}
