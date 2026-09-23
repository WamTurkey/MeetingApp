namespace MeetingApp.API.DTOs;

// ──────────── Generic Lookup ────────────
public record LookupItemDto(string Code, string DisplayName, int SortOrder = 0);

public record AllLookupsDto(
    List<LookupItemDto> MeetingStatuses,
    List<LookupItemDto> NoteTypes,
    List<LookupItemDto> ActionStatuses,
    List<LookupItemDto> ParticipantRoles,
    List<LookupItemDto> RelationTypes,
    List<LookupItemDto> ChangeActions
);
