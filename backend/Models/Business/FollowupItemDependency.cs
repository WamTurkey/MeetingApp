using System;

namespace MeetingApp.API.Models.Business;

public class FollowupItemDependency
{
    public int Id { get; set; }
    
    // The item that is blocked (e.g. "Paint the walls")
    public int ItemId { get; set; }
    public FollowupItem Item { get; set; } = null!;
    
    // The item that must be finished first (e.g. "Plaster the walls")
    public int DependsOnItemId { get; set; }
    public FollowupItem DependsOnItem { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
