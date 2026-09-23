namespace MeetingApp.API.Models.Lookups;

public class LkActionStatus
{
    public string StatusCode { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public int SortOrder { get; set; }

    // Navigation
    public ICollection<Note> Notes { get; set; } = new List<Note>();
    public ICollection<FollowupItem> FollowupItems { get; set; } = new List<FollowupItem>();
}
