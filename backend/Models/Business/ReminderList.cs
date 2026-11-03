using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Models.Business;

public class ReminderList : AuditableEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Color { get; set; } = "#007AFF";
    public string Icon { get; set; } = "list";

    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }
    public ICollection<FollowupItem> Items { get; set; } = new List<FollowupItem>();
}
