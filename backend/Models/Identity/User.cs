namespace MeetingApp.API.Models.Identity;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string HashedPassword { get; set; } = null!;
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsSuperuser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ICollection<UserPreference> Preferences { get; set; } = new List<UserPreference>();
}
