namespace MeetingApp.API.Models.Lookups;

public class LkParticipantRole
{
    public string RoleCode { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public int SortOrder { get; set; }

    // Navigation
    public ICollection<MeetingParticipant> MeetingParticipants { get; set; } = new List<MeetingParticipant>();
}
