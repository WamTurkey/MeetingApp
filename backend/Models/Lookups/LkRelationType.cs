namespace MeetingApp.API.Models.Lookups;

public class LkRelationType
{
    public string TypeCode { get; set; } = null!;
    public string DisplayName { get; set; } = null!;

    // Navigation
    public ICollection<MeetingLink> MeetingLinks { get; set; } = new List<MeetingLink>();
}
