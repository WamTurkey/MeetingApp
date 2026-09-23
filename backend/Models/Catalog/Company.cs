using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Models.Catalog;

public class Company : AuditableEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? ShortName { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation — Audit
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }

    // Navigation — Children
    public ICollection<Person> Persons { get; set; } = new List<Person>();
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
    public ICollection<FollowupItem> FollowupItems { get; set; } = new List<FollowupItem>();
}
