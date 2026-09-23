using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Lookups;

namespace MeetingApp.API.Models.Business;

/// <summary>
/// Immutable audit log — NO soft delete.
/// </summary>
public class FollowupChangeLog
{
    public int Id { get; set; }
    public int FollowupId { get; set; }
    public string Action { get; set; } = null!;
    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Description { get; set; } = null!;
    public int ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }

    // Navigation
    public FollowupItem Followup { get; set; } = null!;
    public LkChangeAction ActionNavigation { get; set; } = null!;
    public User ChangedByUser { get; set; } = null!;
}
