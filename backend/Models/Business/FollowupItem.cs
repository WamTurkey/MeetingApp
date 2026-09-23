using MeetingApp.API.Models.Catalog;
using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Lookups;

namespace MeetingApp.API.Models.Business;

public class FollowupItem : AuditableEntity
{
    public int Id { get; set; }
    public string Text { get; set; } = null!;
    public int? TopicId { get; set; }
    public int? ResponsiblePersonId { get; set; }
    public int? ResponsibleCompanyId { get; set; }
    public DateOnly? DueDate { get; set; }
    public string ActionStatus { get; set; } = "OPEN";
    public DateOnly? CompletedOn { get; set; }
    public string? WaitingReason { get; set; }
    public string? DevelopmentNote { get; set; }
    public int? BlockerItemId { get; set; }
    public int? SourceMeetingId { get; set; }
    public int? SourceNoteId { get; set; }
    public int Version { get; set; }

    // Navigation — Audit
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }

    // Navigation — Relations
    public Person? ResponsiblePerson { get; set; }
    public Company? ResponsibleCompany { get; set; }
    public LkActionStatus ActionStatusNavigation { get; set; } = null!;
    public FollowupItem? BlockerItem { get; set; }
    public Meeting? SourceMeeting { get; set; }
    public Note? SourceNote { get; set; }

    // Navigation — Children
    public ICollection<FollowupItem> BlockedItems { get; set; } = new List<FollowupItem>();
    public ICollection<FollowupChangeLog> ChangeLogs { get; set; } = new List<FollowupChangeLog>();
}
