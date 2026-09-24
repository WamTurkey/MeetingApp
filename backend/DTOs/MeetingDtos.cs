namespace MeetingApp.API.DTOs;

// ──────────── Meeting List Item ────────────
public record MeetingListDto(
    int Id, string Title, string MeetingDate, string? PlannedStart,
    string Status, string StatusDisplay,
    string? ProjectName, string? CompanyName, string? LocationName, string? CategoryName,
    int ParticipantCount, int NoteCount,
    string CreatedAt);

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
    string Role, string RoleDisplay);
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
    int? BlockerItemId, int? SourceMeetingId, string? SourceMeetingTitle,
    int? SourceNoteId, int Version,
    string CreatedAt, string UpdatedAt);

public record CreateFollowupItemDto(
    string Text, int? TopicId = null,
    int? ResponsiblePersonId = null, int? ResponsibleCompanyId = null,
    string? DueDate = null, string? ActionStatus = null,
    string? WaitingReason = null,
    string? DevelopmentNote = null, int? BlockerItemId = null,
    int? SourceMeetingId = null, int? SourceNoteId = null);

public record UpdateFollowupItemDto(
    string Text, int? TopicId,
    int? ResponsiblePersonId, int? ResponsibleCompanyId,
    string? DueDate, string ActionStatus,
    string? CompletedOn, string? WaitingReason,
    string? DevelopmentNote, int? BlockerItemId);

// ──────────── Followup Change Log ────────────
public record FollowupChangeLogDto(
    int Id, string Action, string? FieldName,
    string? OldValue, string? NewValue, string Description,
    int ChangedBy, string ChangedByName, string ChangedAt);

// ──────────── Common ────────────
public record ApiResponse<T>(bool Success, T? Data, string? Message = null);
public record PagedResponse<T>(List<T> Items, int TotalCount, int Page, int PageSize);
