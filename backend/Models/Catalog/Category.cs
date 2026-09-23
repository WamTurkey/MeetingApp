using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Models.Catalog;

public class Category : AuditableEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; } = true;

    // Navigation — Audit
    public User CreatedByUser { get; set; } = null!;
    public User? UpdatedByUser { get; set; }
    public User? DeletedByUser { get; set; }

    // Navigation — Children
    public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
}
