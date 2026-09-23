using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Business;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public MeetingsController(MeetingDbContext db) => _db = db;

    // ──────────── GET /api/meetings ────────────
    [HttpGet]
    public async Task<ActionResult<List<MeetingListDto>>> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Meetings
            .Include(m => m.StatusNavigation)
            .Include(m => m.Project)
            .Include(m => m.Company)
            .Include(m => m.Location)
            .Include(m => m.Category)
            .Include(m => m.Participants)
            .Include(m => m.Notes)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(m => m.Status == status);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(m => m.Title.Contains(search) || (m.Description != null && m.Description.Contains(search)));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.MeetingDate)
            .ThenByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MeetingListDto(
                m.Id, m.Title,
                m.MeetingDate.ToString("yyyy-MM-dd"),
                m.PlannedStart.HasValue ? m.PlannedStart.Value.ToString("HH:mm") : null,
                m.Status, m.StatusNavigation.DisplayName,
                m.Project != null ? m.Project.Name : null,
                m.Company != null ? m.Company.Name : null,
                m.Location != null ? m.Location.Name : null,
                m.Category != null ? m.Category.Name : null,
                m.Participants.Count,
                m.Notes.Count,
                m.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss")))
            .ToListAsync();

        return Ok(new PagedResponse<MeetingListDto>(items, total, page, pageSize));
    }

    // ──────────── GET /api/meetings/{id} ────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<MeetingDetailDto>> GetById(int id)
    {
        var m = await _db.Meetings
            .Include(x => x.StatusNavigation)
            .Include(x => x.Project)
            .Include(x => x.Company)
            .Include(x => x.Location)
            .Include(x => x.Category)
            .Include(x => x.Participants).ThenInclude(p => p.Person).ThenInclude(p => p.Company)
            .Include(x => x.Participants).ThenInclude(p => p.RoleNavigation)
            .Include(x => x.Notes).ThenInclude(n => n.NoteTypeNavigation)
            .Include(x => x.Notes).ThenInclude(n => n.ResponsiblePerson)
            .Include(x => x.Notes).ThenInclude(n => n.ActionStatusNavigation)
            .Include(x => x.ParentLinks).ThenInclude(l => l.ChildMeeting)
            .Include(x => x.ParentLinks).ThenInclude(l => l.RelationTypeNavigation)
            .Include(x => x.ChildLinks).ThenInclude(l => l.ParentMeeting)
            .Include(x => x.ChildLinks).ThenInclude(l => l.RelationTypeNavigation)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (m == null) return NotFound();

        var linkedMeetings = new List<MeetingLinkDto>();
        foreach (var l in m.ParentLinks)
            linkedMeetings.Add(new MeetingLinkDto(l.Id, l.ChildMeetingId, l.ChildMeeting.Title,
                l.ChildMeeting.MeetingDate.ToString("yyyy-MM-dd"),
                l.RelationType, l.RelationTypeNavigation.DisplayName, "CHILD"));
        foreach (var l in m.ChildLinks)
            linkedMeetings.Add(new MeetingLinkDto(l.Id, l.ParentMeetingId, l.ParentMeeting.Title,
                l.ParentMeeting.MeetingDate.ToString("yyyy-MM-dd"),
                l.RelationType, l.RelationTypeNavigation.DisplayName, "PARENT"));

        var dto = new MeetingDetailDto(
            m.Id, m.Title, m.Description, m.Subject,
            m.MeetingDate.ToString("yyyy-MM-dd"),
            m.PlannedStart?.ToString("HH:mm"),
            m.Status, m.StatusNavigation.DisplayName,
            m.ProjectId, m.Project?.Name,
            m.CompanyId, m.Company?.Name,
            m.LocationId, m.Location?.Name,
            m.CategoryId, m.Category?.Name,
            m.StartedAt?.ToString("yyyy-MM-ddTHH:mm:ss"),
            m.EndedAt?.ToString("yyyy-MM-ddTHH:mm:ss"),
            m.NextMeetingAt?.ToString("yyyy-MM-ddTHH:mm:ss"),
            m.NextMeetingNote,
            m.Version,
            m.Participants.Select(p => new ParticipantDto(
                p.Id, p.PersonId, p.Person.FullName,
                p.Person.Company?.Name,
                p.Role, p.RoleNavigation.DisplayName)).ToList(),
            m.Notes.OrderBy(n => n.DisplayOrder).Select(n => new NoteDto(
                n.Id, n.Content, n.NoteType, n.NoteTypeNavigation.DisplayName,
                n.DisplayOrder,
                n.ResponsiblePersonId, n.ResponsiblePerson?.FullName,
                n.DueDate?.ToString("yyyy-MM-dd"),
                n.ActionStatus, n.ActionStatusNavigation?.DisplayName,
                n.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"))).ToList(),
            linkedMeetings,
            m.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
            m.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss"));

        return Ok(dto);
    }

    // ──────────── POST /api/meetings ────────────
    [HttpPost]
    public async Task<ActionResult<MeetingDetailDto>> Create([FromBody] CreateMeetingDto dto)
    {
        var meeting = new Meeting
        {
            Title = dto.Title,
            Description = dto.Description,
            Subject = dto.Subject,
            MeetingDate = DateOnly.Parse(dto.MeetingDate),
            PlannedStart = !string.IsNullOrEmpty(dto.PlannedStart) ? TimeOnly.Parse(dto.PlannedStart) : null,
            Status = "DRAFT",
            ProjectId = dto.ProjectId,
            CompanyId = dto.CompanyId,
            LocationId = dto.LocationId,
            CategoryId = dto.CategoryId,
            NextMeetingNote = dto.NextMeetingNote,
            CreatedBy = 1  // TODO: JWT'den alınacak
        };

        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, await GetDetailDto(meeting.Id));
    }

    // ──────────── PUT /api/meetings/{id} ────────────
    [HttpPut("{id}")]
    public async Task<ActionResult<MeetingDetailDto>> Update(int id, [FromBody] UpdateMeetingDto dto)
    {
        var meeting = await _db.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        meeting.Title = dto.Title;
        meeting.Description = dto.Description;
        meeting.Subject = dto.Subject;
        meeting.MeetingDate = DateOnly.Parse(dto.MeetingDate);
        meeting.PlannedStart = !string.IsNullOrEmpty(dto.PlannedStart) ? TimeOnly.Parse(dto.PlannedStart) : null;
        meeting.Status = dto.Status;
        meeting.ProjectId = dto.ProjectId;
        meeting.CompanyId = dto.CompanyId;
        meeting.LocationId = dto.LocationId;
        meeting.CategoryId = dto.CategoryId;
        meeting.NextMeetingAt = !string.IsNullOrEmpty(dto.NextMeetingAt) ? DateTime.Parse(dto.NextMeetingAt) : null;
        meeting.NextMeetingNote = dto.NextMeetingNote;
        meeting.UpdatedBy = 1;  // TODO: JWT'den alınacak
        meeting.UpdatedAt = DateTime.UtcNow;
        meeting.Version++;

        await _db.SaveChangesAsync();
        return Ok(await GetDetailDto(id));
    }

    // ──────────── DELETE /api/meetings/{id} (Soft Delete) ────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var meeting = await _db.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        meeting.IsDeleted = true;
        meeting.DeletedAt = DateTime.UtcNow;
        meeting.DeletedBy = 1;  // TODO: JWT'den alınacak
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ──────────── POST /api/meetings/{id}/participants ────────────
    [HttpPost("{id}/participants")]
    public async Task<ActionResult<ParticipantDto>> AddParticipant(int id, [FromBody] AddParticipantDto dto)
    {
        if (!await _db.Meetings.AnyAsync(m => m.Id == id)) return NotFound();

        var participant = new MeetingParticipant
        {
            MeetingId = id,
            PersonId = dto.PersonId,
            Role = dto.Role,
            CreatedBy = 1
        };
        _db.MeetingParticipants.Add(participant);
        await _db.SaveChangesAsync();

        var p = await _db.MeetingParticipants
            .Include(x => x.Person).ThenInclude(x => x.Company)
            .Include(x => x.RoleNavigation)
            .FirstAsync(x => x.Id == participant.Id);

        return Created("", new ParticipantDto(p.Id, p.PersonId, p.Person.FullName,
            p.Person.Company?.Name, p.Role, p.RoleNavigation.DisplayName));
    }

    // ──────────── DELETE /api/meetings/{id}/participants/{participantId} ────────────
    [HttpDelete("{id}/participants/{participantId}")]
    public async Task<IActionResult> RemoveParticipant(int id, int participantId)
    {
        var p = await _db.MeetingParticipants.FirstOrDefaultAsync(x => x.Id == participantId && x.MeetingId == id);
        if (p == null) return NotFound();
        _db.MeetingParticipants.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────── POST /api/meetings/{id}/notes ────────────
    [HttpPost("{id}/notes")]
    public async Task<ActionResult<NoteDto>> AddNote(int id, [FromBody] CreateNoteDto dto)
    {
        if (!await _db.Meetings.AnyAsync(m => m.Id == id)) return NotFound();

        var note = new Note
        {
            MeetingId = id,
            Content = dto.Content,
            NoteType = dto.NoteType,
            DisplayOrder = dto.DisplayOrder,
            ResponsiblePersonId = dto.ResponsiblePersonId,
            DueDate = !string.IsNullOrEmpty(dto.DueDate) ? DateOnly.Parse(dto.DueDate) : null,
            ActionStatus = dto.ActionStatus,
            CreatedBy = 1
        };
        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        var n = await _db.Notes
            .Include(x => x.NoteTypeNavigation)
            .Include(x => x.ResponsiblePerson)
            .Include(x => x.ActionStatusNavigation)
            .FirstAsync(x => x.Id == note.Id);

        return Created("", new NoteDto(n.Id, n.Content, n.NoteType, n.NoteTypeNavigation.DisplayName,
            n.DisplayOrder, n.ResponsiblePersonId, n.ResponsiblePerson?.FullName,
            n.DueDate?.ToString("yyyy-MM-dd"), n.ActionStatus, n.ActionStatusNavigation?.DisplayName,
            n.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss")));
    }

    // ──────────── PUT /api/meetings/{id}/notes/{noteId} ────────────
    [HttpPut("{id}/notes/{noteId}")]
    public async Task<ActionResult<NoteDto>> UpdateNote(int id, int noteId, [FromBody] UpdateNoteDto dto)
    {
        var note = await _db.Notes.FirstOrDefaultAsync(n => n.Id == noteId && n.MeetingId == id);
        if (note == null) return NotFound();

        note.Content = dto.Content;
        note.NoteType = dto.NoteType;
        note.DisplayOrder = dto.DisplayOrder;
        note.ResponsiblePersonId = dto.ResponsiblePersonId;
        note.DueDate = !string.IsNullOrEmpty(dto.DueDate) ? DateOnly.Parse(dto.DueDate) : null;
        note.ActionStatus = dto.ActionStatus;
        note.UpdatedBy = 1;
        note.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var n = await _db.Notes
            .Include(x => x.NoteTypeNavigation)
            .Include(x => x.ResponsiblePerson)
            .Include(x => x.ActionStatusNavigation)
            .FirstAsync(x => x.Id == noteId);

        return Ok(new NoteDto(n.Id, n.Content, n.NoteType, n.NoteTypeNavigation.DisplayName,
            n.DisplayOrder, n.ResponsiblePersonId, n.ResponsiblePerson?.FullName,
            n.DueDate?.ToString("yyyy-MM-dd"), n.ActionStatus, n.ActionStatusNavigation?.DisplayName,
            n.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss")));
    }

    // ──────────── DELETE /api/meetings/{id}/notes/{noteId} ────────────
    [HttpDelete("{id}/notes/{noteId}")]
    public async Task<IActionResult> DeleteNote(int id, int noteId)
    {
        var note = await _db.Notes.FirstOrDefaultAsync(n => n.Id == noteId && n.MeetingId == id);
        if (note == null) return NotFound();
        note.IsDeleted = true;
        note.DeletedAt = DateTime.UtcNow;
        note.DeletedBy = 1;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────── POST /api/meetings/{id}/links ────────────
    [HttpPost("{id}/links")]
    public async Task<ActionResult<MeetingLinkDto>> AddLink(int id, [FromBody] CreateMeetingLinkDto dto)
    {
        if (!await _db.Meetings.AnyAsync(m => m.Id == id)) return NotFound();
        var link = new MeetingLink
        {
            ParentMeetingId = id,
            ChildMeetingId = dto.ChildMeetingId,
            RelationType = dto.RelationType,
            CreatedBy = 1
        };
        _db.MeetingLinks.Add(link);
        await _db.SaveChangesAsync();

        var l = await _db.MeetingLinks
            .Include(x => x.ChildMeeting)
            .Include(x => x.RelationTypeNavigation)
            .FirstAsync(x => x.Id == link.Id);

        return Created("", new MeetingLinkDto(l.Id, l.ChildMeetingId, l.ChildMeeting.Title,
            l.ChildMeeting.MeetingDate.ToString("yyyy-MM-dd"),
            l.RelationType, l.RelationTypeNavigation.DisplayName, "CHILD"));
    }

    // ── Helper ──
    private async Task<MeetingDetailDto?> GetDetailDto(int id)
    {
        var result = await GetById(id);
        return (result.Result as OkObjectResult)?.Value as MeetingDetailDto
            ?? (result.Value);
    }
}
