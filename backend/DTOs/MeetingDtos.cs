namespace MeetingApp.API.DTOs;

// ──────────── Meeting List Item ────────────
public record MeetingListDto(
    int Id, string Title, string MeetingDate, string? PlannedStart,
    string Status, string StatusDisplay,
    int? ProjectId, string? ProjectName,
    string? CompanyName,
    int? LocationId, string? LocationName,
    int? CategoryId, string? CategoryName,
    int ParticipantCount, int NoteCount,
    string CreatedAt,
    int LinkCount = 0);

// ──────────── Meeting Detail ────────────
public record MeetingDetailDto(
    int Id, string Title, string? Description, string? Subject,
    string MeetingDate, string? PlannedStart,
    string Status, string StatusDisplay,
    int? ProjectId, string? ProjectName,
    int? CompanyId, string? CompanyName,
    int? LocationId, string? LocationName,
    int? CategoryId, string? CategoryName,
    string? StartedAt, string? EndedAt,
    string? NextMeetingAt, string? NextMeetingNote,
    int Version,
    List<ParticipantDto> Participants,
    List<NoteDto> Notes,
    List<MeetingLinkDto> LinkedMeetings,
    string CreatedAt, string UpdatedAt);

// ──────────── Create / Update Meeting ────────────
public record CreateMeetingDto(
    string Title, string? Description, string? Subject,
    string MeetingDate, string? PlannedStart,
    int? ProjectId, int? CompanyId, int? LocationId, int? CategoryId,
    string? NextMeetingNote);

public record UpdateMeetingDto(
    string Title, string? Description, string? Subject,
    string MeetingDate, string? PlannedStart,
    string Status,
    int? ProjectId, int? CompanyId, int? LocationId, int? CategoryId,
    string? NextMeetingAt, string? NextMeetingNote);

// ──────────── Participant ────────────
public record ParticipantDto(
    int Id, int PersonId, string PersonName, string? CompanyName,
    string? Email, string? Phone, string? Title,
    string Role, string RoleDisplay, bool IsAttended);
public record AddParticipantDto(int PersonId, string Role = "ATTENDEE");

// ──────────── Note ────────────
public record NoteDto(
    int Id, string Content, string NoteType, string NoteTypeDisplay,
    int DisplayOrder,
    int? ResponsiblePersonId, string? ResponsiblePersonName,
    string? DueDate, string? ActionStatus, string? ActionStatusDisplay,
    string CreatedAt);
public record CreateNoteDto(
    string Content, string NoteType = "NOTE", int DisplayOrder = 0,
    int? ResponsiblePersonId = null, string? DueDate = null, string? ActionStatus = null);
public record UpdateNoteDto(
    string Content, string NoteType, int DisplayOrder,
    int? ResponsiblePersonId, string? DueDate, string? ActionStatus);

// ──────────── Reorder ────────────
public record ReorderItemDto(string Type, int Id, int Order);

// ──────────── Meeting Link ────────────
public record MeetingLinkDto(
    int Id, int LinkedMeetingId, string LinkedMeetingTitle,
    string LinkedMeetingDate, string RelationType, string RelationTypeDisplay, string Direction);
public record CreateMeetingLinkDto(int ChildMeetingId, string RelationType = "CONTINUATION");

// ──────────── Followup Item ────────────
public record FollowupItemDto(
    int Id, string Text, int? TopicId,
    int? ResponsiblePersonId, string? ResponsiblePersonName,
    int? ResponsibleCompanyId, string? ResponsibleCompanyName,
    string? DueDate, string ActionStatus, string ActionStatusDisplay,
    string? CompletedOn, string? WaitingReason, string? DevelopmentNote,
    List<int>? DependencyItemIds, int? SourceMeetingId, string? SourceMeetingTitle,
    int? SourceNoteId, int Version,
    int? ListId, string? ListName, bool IsFlagged, bool IsUrgent,
    int? LinkedFollowupId,
    string CreatedAt, string UpdatedAt);

public record CreateFollowupItemDto(
    string Text, int? TopicId = null,
    int? ResponsiblePersonId = null, int? ResponsibleCompanyId = null,
    string? DueDate = null, string? ActionStatus = null,
    string? WaitingReason = null,
    string? DevelopmentNote = null, List<int>? DependencyItemIds = null,
    int? SourceMeetingId = null, int? SourceNoteId = null,
    int? ListId = null, bool IsFlagged = false, bool IsUrgent = false,
    int? LinkedFollowupId = null);

public record UpdateFollowupItemDto(
    string Text, int? TopicId,
    int? ResponsiblePersonId, int? ResponsibleCompanyId,
    string? DueDate, string ActionStatus,
    string? CompletedOn, string? WaitingReason,
    string? DevelopmentNote, List<int>? DependencyItemIds,
    int? ListId = null, bool IsFlagged = false, bool IsUrgent = false,
    int? LinkedFollowupId = null);

public record ReminderListDto(int Id, string Name, string Color, string Icon, int ItemCount);
public record CreateReminderListDto(string Name, string Color = "#007AFF", string Icon = "list");
public record UpdateReminderListDto(string Name, string Color, string Icon);

// ──────────── Followup Change Log ────────────
public record FollowupChangeLogDto(
    int Id, string Action, string? FieldName,
    string? OldValue, string? NewValue, string Description,
    int ChangedBy, string ChangedByName, string ChangedAt);

// ──────────── Common ────────────
public record ApiResponse<T>(bool Success, T? Data, string? Message = null);
public record PagedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize);
