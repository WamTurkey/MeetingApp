namespace MeetingApp.API.Models.Lookups;

public class LkNoteType
{
    public string TypeCode { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public int SortOrder { get; set; }

    // Navigation
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
