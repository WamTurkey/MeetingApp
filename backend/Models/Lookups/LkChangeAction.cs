namespace MeetingApp.API.Models.Lookups;

public class LkChangeAction
{
    public string ActionCode { get; set; } = null!;
    public string DisplayName { get; set; } = null!;

    // Navigation
    public ICollection<FollowupChangeLog> FollowupChangeLogs { get; set; } = new List<FollowupChangeLog>();
}
