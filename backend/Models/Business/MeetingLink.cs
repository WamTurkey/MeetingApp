using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Lookups;

namespace MeetingApp.API.Models.Business;

public class MeetingLink
{
    public int Id { get; set; }
    public int ParentMeetingId { get; set; }
    public int ChildMeetingId { get; set; }
    public string RelationType { get; set; } = null!;
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Meeting ParentMeeting { get; set; } = null!;
    public Meeting ChildMeeting { get; set; } = null!;
    public LkRelationType RelationTypeNavigation { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}
