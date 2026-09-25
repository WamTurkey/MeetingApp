using System;
using System.Collections.Generic;
using MeetingApp.API.Models.Business;

namespace MeetingApp.API.Models
{
    public class MeetingMinutesExportDto
    {
        public int MeetingId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public DateOnly? MeetingDate { get; set; }
        public TimeOnly? MeetingTime { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;

        public List<InternalParticipantGroupDto> InternalParticipants { get; set; } = new();
        public List<ExternalParticipantDto> ExternalParticipants { get; set; } = new();

        public List<Note> Notes { get; set; } = new();
    }

    public class InternalParticipantGroupDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string ParticipantsText { get; set; } = string.Empty;
    }

    public class ExternalParticipantDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }
}
