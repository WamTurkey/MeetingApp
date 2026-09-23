namespace MeetingApp.API.Models.Identity;

public class UserPreference
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string PreferenceKey { get; set; } = null!;
    public string PreferenceValue { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}
