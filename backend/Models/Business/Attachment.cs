using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Models.Business;

/// <summary>
/// Polimorfik ek dosya — EntityType + EntityId ile herhangi bir tabloya bağlanır.
/// UploadedBy alanı, ana User FK olarak kullanılır (CreatedBy yerine).
/// </summary>
public class Attachment
{
    public int Id { get; set; }
    public string EntityType { get; set; } = null!;  // "MEETING", "NOTE", "FOLLOWUP"
    public int EntityId { get; set; }
    public string FileName { get; set; } = null!;
    public string FileExtension { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public string MimeType { get; set; } = null!;
    public string StoragePath { get; set; } = null!;
    public string? Description { get; set; }
    public int UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? DeletedBy { get; set; }

    // Navigation
    public User UploadedByUser { get; set; } = null!;
    public User? DeletedByUser { get; set; }
}
