namespace MeetingApp.API.Models;

/// <summary>
/// Audit + Soft Delete alanlarını taşıyan temel sınıf.
/// Companies, Projects, Locations, Categories, Persons, Meetings, Notes, FollowupItems, Attachments tarafından kullanılır.
/// </summary>
public abstract class AuditableEntity
{
    public int CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? DeletedBy { get; set; }
}
