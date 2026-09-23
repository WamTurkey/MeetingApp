using MeetingApp.API.Models.Catalog;
using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Lookups;

namespace MeetingApp.API.Models.Business;

public class Note : AuditableEntity
{
    public int Id { get; set; }
    public int MeetingId { get; set; }
    public string Content { get; set; } = null!;
    public string NoteType { get; set; } = "NOTE";
    public int DisplayOrder { get; set; }
    public int? ResponsiblePersonId { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? ActionStatus { get; set; }
    public int? TopicId { get; set; }

    // Navigation — Audit
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }

    // Navigation — Relations
    public Meeting Meeting { get; set; } = null!;
    public LkNoteType NoteTypeNavigation { get; set; } = null!;
    public Person? ResponsiblePerson { get; set; }
    public LkActionStatus? ActionStatusNavigation { get; set; }

    // Navigation — Children
    public ICollection<FollowupItem> SourceFollowups { get; set; } = new List<FollowupItem>();
}
