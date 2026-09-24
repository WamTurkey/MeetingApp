using MeetingApp.API.Models.Catalog;
using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Lookups;

namespace MeetingApp.API.Models.Business;

public class MeetingParticipant
{
    public int Id { get; set; }
    public int MeetingId { get; set; }
    public int PersonId { get; set; }
    public string Role { get; set; } = "ATTENDEE";
    public bool IsAttended { get; set; } = false;
    public int CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Meeting Meeting { get; set; } = null!;
    public Person Person { get; set; } = null!;
    public LkParticipantRole RoleNavigation { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
}
