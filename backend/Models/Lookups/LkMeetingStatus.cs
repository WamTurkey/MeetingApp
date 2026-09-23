namespace MeetingApp.API.Models.Lookups;

public class LkMeetingStatus
{
    public string StatusCode { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public int SortOrder { get; set; }

    // Navigation
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
}
