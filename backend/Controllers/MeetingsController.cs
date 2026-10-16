using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using MeetingApp.API.Models;
using MeetingApp.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Business;
using ClosedXML.Excel;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController : BaseApiController
{
    private readonly MeetingDbContext _db;
    private readonly OutlookCalendarService _outlook;
    public MeetingsController(MeetingDbContext db, OutlookCalendarService outlook)
    {
        _db = db;
        _outlook = outlook;
    }

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
                p.Person.Email, p.Person.Phone, p.Person.Title,
                p.Role, p.RoleNavigation.DisplayName, p.IsAttended)).ToList(),
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
            CreatedBy = CurrentUserId
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
        meeting.UpdatedBy = CurrentUserId;
        meeting.UpdatedAt = DateTime.UtcNow;
        meeting.Version++;

        await _db.SaveChangesAsync();
        return Ok(await GetDetailDto(id));
    }

    // ──────────── PUT /api/meetings/{id}/reorder-items ────────────
                [HttpPut("{id}/reorder-items")]
    public async Task<IActionResult> ReorderItems(int id, [FromBody] List<ReorderItemDto> items)
    {
        try 
        {
            var noteUpdates = items.Where(x => x.Type == "NOTE").ToList();
            var followupUpdates = items.Where(x => x.Type == "FOLLOWUP").ToList();

            var notes = await _db.Notes.Where(n => n.MeetingId == id).ToListAsync();
            var followups = await _db.FollowupItems.Where(f => f.SourceMeetingId == id).ToListAsync();

            foreach (var update in noteUpdates)
            {
                var n = notes.FirstOrDefault(x => x.Id == update.Id);
                if (n != null) n.DisplayOrder = update.Order;
            }

            foreach (var update in followupUpdates)
            {
                var f = followups.FirstOrDefault(x => x.Id == update.Id);
                if (f != null) f.DisplayOrder = update.Order;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine("REORDER EXCEPTION: " + ex.ToString());
            return StatusCode(500, new { message = "Sıralama güncellenirken bir hata oluştu." });
        }
    }

    // ──────────── DELETE /api/meetings/{id} (Soft Delete) ────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var meeting = await _db.Meetings.FindAsync(id);
        if (meeting == null) return NotFound();

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");
        var now = DateTime.UtcNow;

        meeting.IsDeleted = true;
        meeting.DeletedAt = now;
        meeting.DeletedBy = userId;

        // Cascade Soft-Delete Notes
        var notes = await _db.Notes.Where(n => n.MeetingId == id && !n.IsDeleted).ToListAsync();
        foreach (var note in notes)
        {
            note.IsDeleted = true;
            note.DeletedAt = now;
            note.DeletedBy = userId;
        }

        // Cascade Soft-Delete Followups
        var followups = await _db.FollowupItems.Where(f => f.SourceMeetingId == id && !f.IsDeleted).ToListAsync();
        foreach (var followup in followups)
        {
            followup.IsDeleted = true;
            followup.DeletedAt = now;
            followup.DeletedBy = userId;
            followup.ActionStatus = "CANCELLED"; // Optionally mark as cancelled
        }

        // Cascade Soft-Delete Attachments
        var attachments = await _db.Attachments.Where(a => a.EntityType == "Meeting" && a.EntityId == id && !a.IsDeleted).ToListAsync();
        foreach (var attachment in attachments)
        {
            attachment.IsDeleted = true;
            attachment.DeletedAt = now;
            attachment.DeletedBy = userId;
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ──────────── POST /api/meetings/{id}/participants ────────────
    [HttpPost("{id}/participants")]
    public async Task<ActionResult<ParticipantDto>> AddParticipant(int id, [FromBody] AddParticipantDto dto)
    {
        if (!await _db.Meetings.AnyAsync(m => m.Id == id)) return NotFound();
        if (!await _db.LkParticipantRoles.AnyAsync(r => r.RoleCode == dto.Role))
            return BadRequest(new { message = $"Geçersiz katılımcı rolü: '{dto.Role}'." });
        if (!await _db.Persons.AnyAsync(p => p.Id == dto.PersonId))
            return BadRequest(new { message = "Seçilen kişi bulunamadı." });
        if (await _db.MeetingParticipants.AnyAsync(x => x.MeetingId == id && x.PersonId == dto.PersonId))
            return Conflict(new { message = "Bu kişi zaten bu toplantıya katılımcı olarak eklenmiş." });

        var participant = new MeetingParticipant
        {
            MeetingId = id,
            PersonId = dto.PersonId,
            Role = dto.Role,
            IsAttended = true, // Default as requested
            CreatedBy = CurrentUserId
        };
        _db.MeetingParticipants.Add(participant);
        await _db.SaveChangesAsync();

        var p = await _db.MeetingParticipants
            .Include(x => x.Person).ThenInclude(x => x.Company)
            .Include(x => x.RoleNavigation)
            .FirstAsync(x => x.Id == participant.Id);

        return Created("", new ParticipantDto(p.Id, p.PersonId, p.Person.FullName,
            p.Person.Company?.Name, p.Person.Email, p.Person.Phone, p.Person.Title,
            p.Role, p.RoleNavigation.DisplayName, p.IsAttended));
    }


    // ──────────── PATCH /api/meetings/{id}/participants/{participantId}/attendance ────────────
    [HttpPatch("{id}/participants/{participantId}/attendance")]
    public async Task<IActionResult> ToggleAttendance(int id, int participantId, [FromBody] bool isAttended)
    {
        var p = await _db.MeetingParticipants.FirstOrDefaultAsync(x => x.Id == participantId && x.MeetingId == id);
        if (p == null) return NotFound();
        
        p.IsAttended = isAttended;
        p.UpdatedBy = CurrentUserId;
        p.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        return NoContent();
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
        if (!await _db.LkNoteTypes.AnyAsync(t => t.TypeCode == dto.NoteType))
            return BadRequest(new { message = $"Geçersiz not tipi: '{dto.NoteType}'." }); // FK ihlali → 500 yerine 400

        var note = new Note
        {
            MeetingId = id,
            Content = dto.Content,
            NoteType = dto.NoteType,
            DisplayOrder = dto.DisplayOrder,
            ResponsiblePersonId = dto.ResponsiblePersonId,
            DueDate = !string.IsNullOrEmpty(dto.DueDate) ? DateOnly.Parse(dto.DueDate) : null,
            ActionStatus = string.IsNullOrWhiteSpace(dto.ActionStatus) ? null : NoteFollowupSync.NormalizeStatus(dto.ActionStatus),
            CreatedBy = CurrentUserId
        };
        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        // ────────────────────────────
        // TAKİP/TERMİN ENTEGRASYONU (bkz. NoteFollowupSync kuralları)
        // ────────────────────────────
        await NoteFollowupSync.SyncFromNoteAsync(_db, note, CurrentUserId);
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
        if (!await _db.LkNoteTypes.AnyAsync(t => t.TypeCode == dto.NoteType))
            return BadRequest(new { message = $"Geçersiz not tipi: '{dto.NoteType}'." });

        note.Content = dto.Content;
        note.NoteType = dto.NoteType;
        note.DisplayOrder = dto.DisplayOrder;
        note.ResponsiblePersonId = dto.ResponsiblePersonId;
        note.DueDate = !string.IsNullOrEmpty(dto.DueDate) ? DateOnly.Parse(dto.DueDate) : null;
        note.ActionStatus = string.IsNullOrWhiteSpace(dto.ActionStatus) ? null : NoteFollowupSync.NormalizeStatus(dto.ActionStatus);
        note.UpdatedBy = CurrentUserId;
        note.UpdatedAt = DateTime.UtcNow;

        // ────────────────────────────
        // TAKİP/TERMİN ENTEGRASYONU GÜNCELLEMESİ — tek SaveChanges ile atomik
        // (Eski satır içi mantık "CLOSED" gibi LK_ActionStatus'ta olmayan bir kod yazıp FK hatasına yol açıyordu.)
        // ────────────────────────────
        await NoteFollowupSync.SyncFromNoteAsync(_db, note, CurrentUserId);
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
        note.DeletedBy = CurrentUserId;
        // Bağlı takip kaydı da soft-delete (Takip & Terminler'de "hayalet" kayıt kalmasın)
        await NoteFollowupSync.CascadeDeleteAsync(_db, note.Id, CurrentUserId);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────── POST /api/meetings/{id}/links ────────────
    [HttpPost("{id}/links")]
    public async Task<ActionResult<MeetingLinkDto>> AddLink(int id, [FromBody] CreateMeetingLinkDto dto)
    {
        if (!await _db.Meetings.AnyAsync(m => m.Id == id)) return NotFound();
        if (!await _db.Meetings.AnyAsync(m => m.Id == dto.ChildMeetingId))
            return BadRequest(new { message = "Bağlanmak istenen toplantı bulunamadı." });

        // Kendine bağlama = en basit döngü
        if (dto.ChildMeetingId == id)
            return BadRequest(new { code = "CYCLIC_LINK", message = "Döngüsel bağlı toplantı oluşturulamaz." });
        
        // Check for duplicate link
        var existing = await _db.MeetingLinks.FirstOrDefaultAsync(x => 
            x.ParentMeetingId == id && x.ChildMeetingId == dto.ChildMeetingId);
        if (existing != null)
            return Conflict(new { message = "Bu toplantı bağlantısı zaten mevcut." });

        // Döngü kontrolü: child'dan başlayıp ileri (parent→child) yönde ilerlerken
        // bu toplantıya (id) ulaşılabiliyorsa, yeni bağlantı bir döngü kapatır.
        if (await CreatesCycleAsync(id, dto.ChildMeetingId))
            return BadRequest(new { code = "CYCLIC_LINK", message = "Döngüsel bağlı toplantı oluşturulamaz." });
        
        var link = new MeetingLink
        {
            ParentMeetingId = id,
            ChildMeetingId = dto.ChildMeetingId,
            RelationType = dto.RelationType,
            CreatedBy = CurrentUserId
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

    /// <summary>
    /// parentId → childId bağlantısı eklenirse döngü oluşur mu? (BFS, ziyaret edilen düğümler takip edilir)
    /// </summary>
    private async Task<bool> CreatesCycleAsync(int parentId, int childId)
    {
        var edges = await _db.MeetingLinks
            .Select(l => new { l.ParentMeetingId, l.ChildMeetingId })
            .ToListAsync();
        var adjacency = edges
            .GroupBy(e => e.ParentMeetingId)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ChildMeetingId).ToList());

        var visited = new HashSet<int>();
        var queue = new Queue<int>();
        queue.Enqueue(childId);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (current == parentId) return true;
            if (!visited.Add(current)) continue;
            if (adjacency.TryGetValue(current, out var next))
                foreach (var n in next) queue.Enqueue(n);
        }
        return false;
    }

    // ──────────── DELETE /api/meetings/{id}/links/{linkId} ────────────
    [HttpDelete("{id}/links/{linkId}")]
    public async Task<IActionResult> DeleteLink(int id, int linkId)
    {
        var link = await _db.MeetingLinks.FindAsync(linkId);
        if (link == null) 
            return NotFound();

        // Security check: link should belong to the meeting requested
        if (link.ParentMeetingId != id && link.ChildMeetingId != id)
            return Forbid();

        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");

        // Find all FollowupItems in ChildMeeting that were rolled over from ParentMeeting
        var rolledOverItems = await _db.FollowupItems
            .Include(f => f.RolledOverFrom)
            .Where(f => f.SourceMeetingId == link.ChildMeetingId && 
                        f.RolledOverFromId != null && 
                        f.RolledOverFrom!.SourceMeetingId == link.ParentMeetingId && 
                        !f.IsDeleted)
            .ToListAsync();

        if (rolledOverItems.Any())
        {
            // Restore the old items' status if they were ROLLED_OVER
            var oldItemIds = rolledOverItems.Where(f => f.RolledOverFromId.HasValue).Select(f => f.RolledOverFromId.GetValueOrDefault()).ToList();
            var oldItems = await _db.FollowupItems.Where(f => oldItemIds.Contains(f.Id)).ToListAsync();
            foreach(var oldItem in oldItems) {
                if (oldItem.ActionStatus == "ROLLED_OVER") 
                {
                    oldItem.ActionStatus = "OPEN";
                    oldItem.UpdatedBy = currentUserId;
                    oldItem.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Soft delete the new FollowupItems
            var noteIds = new List<int>();
            foreach (var item in rolledOverItems)
            {
                item.IsDeleted = true;
                item.DeletedAt = DateTime.UtcNow;
                item.DeletedBy = currentUserId;
                if (item.SourceNoteId.HasValue) noteIds.Add(item.SourceNoteId.Value);
            }

            // Soft delete the associated Notes
            if (noteIds.Any())
            {
                var notes = await _db.Notes.Where(n => noteIds.Contains(n.Id)).ToListAsync();
                foreach (var note in notes)
                {
                    note.IsDeleted = true;
                    note.DeletedAt = DateTime.UtcNow;
                    note.DeletedBy = currentUserId;
                }
            }
        }

        _db.MeetingLinks.Remove(link);
        await _db.SaveChangesAsync();

        return NoContent();
    }


    // ──────────── GET /api/meetings/{id}/preparation ────────────
    [HttpGet("{id}/preparation")]
    public async Task<ActionResult<IEnumerable<FollowupItemDto>>> GetPreparationItems(int id)
    {
        // Find previous meeting(s) -> meaning the current meeting is the child, so we look at MeetingLinks where ChildMeetingId = id
        var parentMeetingIds = await _db.MeetingLinks
            .Where(x => x.ChildMeetingId == id)
            .Select(x => x.ParentMeetingId)
            .ToListAsync();

        if (!parentMeetingIds.Any())
            return Ok(new List<FollowupItemDto>());

        var openItems = await _db.FollowupItems
            .Include(x => x.ResponsiblePerson)
            .Include(x => x.ResponsibleCompany)
            .Include(x => x.ActionStatusNavigation)
            .Include(x => x.DependentOn)
            .Where(x => x.SourceMeetingId != null && parentMeetingIds.Contains(x.SourceMeetingId.Value))
            .Where(x => x.ActionStatus != "COMPLETED" && x.ActionStatus != "CANCELLED" && x.ActionStatus != "ROLLED_OVER" && x.ActionStatus != "DONE")
            .ToListAsync();

        var dtos = openItems.Select(x => new FollowupItemDto(
            x.Id, x.Text, x.TopicId, x.ResponsiblePersonId, x.ResponsiblePerson?.FullName,
            x.ResponsibleCompanyId, x.ResponsibleCompany?.Name,
            x.DueDate?.ToString("yyyy-MM-dd"), x.ActionStatus, x.ActionStatusNavigation.DisplayName,
            x.CompletedOn?.ToString("yyyy-MM-dd"), x.WaitingReason, x.DevelopmentNote,
            x.DependentOn.Select(d => d.DependsOnItemId).ToList(), x.SourceMeetingId, null,
            x.SourceNoteId, x.Version,
            x.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"), x.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss")
        ));

        return Ok(dtos);
    }

    // ──────────── POST /api/meetings/{id}/rollover-items ────────────
    [HttpPost("{id}/rollover-items")]
    public async Task<ActionResult> RolloverItems(int id, [FromBody] List<int> itemIds)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");

        var oldItems = await _db.FollowupItems
            .Where(x => itemIds.Contains(x.Id))
            .ToListAsync();

        foreach (var oldItem in oldItems)
        {
            oldItem.ActionStatus = "ROLLED_OVER";
            oldItem.UpdatedBy = currentUserId;
            oldItem.UpdatedAt = DateTime.UtcNow;

            var newNote = new Note
            {
                MeetingId = id,
                Content = oldItem.Text,
                NoteType = "TASK", // Aktarılan maddeler genelde görev/karardır
                ResponsiblePersonId = oldItem.ResponsiblePersonId,
                DueDate = oldItem.DueDate,
                ActionStatus = "OPEN",
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };
            _db.Notes.Add(newNote);
            await _db.SaveChangesAsync(); // SourceNoteId için ID gerekiyor

            var newItem = new FollowupItem
            {
                Text = oldItem.Text,
                TopicId = oldItem.TopicId,
                ResponsiblePersonId = oldItem.ResponsiblePersonId,
                ResponsibleCompanyId = oldItem.ResponsibleCompanyId,
                DueDate = oldItem.DueDate,
                ActionStatus = "OPEN",
                WaitingReason = oldItem.WaitingReason,
                SourceMeetingId = id,
                SourceNoteId = newNote.Id,
                RolledOverFromId = oldItem.Id,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                Version = 1
            };

            _db.FollowupItems.Add(newItem);
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    // ── Helper ──
    private async Task<MeetingDetailDto?> GetDetailDto(int id)
    {
        var result = await GetById(id);
        return (result.Result as OkObjectResult)?.Value as MeetingDetailDto
            ?? (result.Value);
    }

    // ──────────── EXPORTS ────────────

    private async Task<MeetingMinutesExportDto?> GetExportDto(int id)
    {
        var m = await _db.Meetings
            .Include(x => x.Project)
            .Include(x => x.Category)
            .Include(x => x.Location)
            .Include(x => x.Participants).ThenInclude(p => p.Person).ThenInclude(p => p.Company)
            .Include(x => x.Participants).ThenInclude(p => p.RoleNavigation)
            .Include(x => x.Notes).ThenInclude(n => n.NoteTypeNavigation)
            .Include(x => x.Notes).ThenInclude(n => n.ResponsiblePerson)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (m == null) return null;

        var dto = new MeetingMinutesExportDto
        {
            MeetingId = m.Id,
            Title = m.Title ?? string.Empty,
            Subject = m.Subject ?? string.Empty,
            Description = m.Description ?? string.Empty,
            MeetingDate = m.MeetingDate,
            MeetingTime = m.PlannedStart,
            LocationName = m.Location?.Name ?? "-",
            ProjectName = m.Project?.Name ?? "-",
            CategoryName = m.Category?.Name ?? "-",
            NextMeetingAt = m.NextMeetingAt,
            NextMeetingNote = m.NextMeetingNote,
            // Fallback: gündemsiz toplantıda boş liste (null değil)
            Notes = (m.Notes ?? new List<Note>())
                .Where(n => n != null)
                .OrderBy(n => n.DisplayOrder)
                .ToList()
        };

        // Fallback: katılımcısız toplantıda boş liste; kişisi silinmiş katılımcılar atlanır
        var participants = (m.Participants ?? new List<MeetingParticipant>())
            .Where(p => p != null && p.Person != null)
            .ToList();

        dto.Participants = participants.Select(p => new ExportParticipantDto
        {
            CompanyName = p.Person?.Company?.Name ?? "",
            RoleName = p.RoleNavigation?.DisplayName ?? p.Role ?? "",
            Title = p.Person?.Title ?? "",
            FullName = p.Person?.FullName ?? ""
        }).ToList();

        dto.InternalParticipants = participants
            .Where(p => (p.Person?.Company?.FirmType ?? "EXTERNAL") == "INTERNAL")
            .GroupBy(p => p.Person?.Company?.Name ?? "Belirtilmedi")
            .Select(g => new InternalParticipantGroupDto
            {
                CompanyName = g.Key,
                ParticipantsText = string.Join(", ", g.Select(x => x.Person?.FullName ?? ""))
            }).ToList();

        dto.ExternalParticipants = participants
            .Where(p => (p.Person?.Company?.FirmType ?? "EXTERNAL") == "EXTERNAL")
            .OrderBy(p => p.Person?.Company?.Name)
            .ThenBy(p => p.Person?.FullName)
            .Select(p => new ExternalParticipantDto
            {
                CompanyName = p.Person?.Company?.Name ?? "Belirtilmedi",
                Title = p.RoleNavigation?.DisplayName ?? p.Role ?? string.Empty,
                FullName = p.Person?.FullName ?? string.Empty
            }).ToList();

        return dto;
    }

    [HttpGet("{id}/export/excel")]
    public async Task<IActionResult> ExportToExcel(int id)
    {
        var dto = await GetExportDto(id);
        if (dto == null) return NotFound();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Toplantı Tutanağı");

        var fontName = "Calibri";
        var sectionBorder = XLBorderStyleValues.Medium;
        var thinBorder = XLBorderStyleValues.Thin;
        var borderColor = XLColor.FromHtml("#4B5563");
        var headerBg = XLColor.FromHtml("#E2E8F0");
        var headerFontColor = XLColor.FromHtml("#0F172A");
        var dataRowBg = XLColor.FromHtml("#F2F2F2");

        // Sütun genişlikleri: Kurumsal A4 şablonuna ve önizlemeye birebir uyumlu
        ws.Column(1).Width = 5.0;  // Sıra No
        ws.Column(2).Width = 56.0; // Sol sütun: Başlık / Konu / Katılımcı Firma & Unvan
        ws.Column(3).Width = 46.0; // Sağ sütun: Toplantı Adı / Tarih-Saat / Ad Soyad

        int row = 1;

        // ═══════════════════════════════════════════════════════════════
        // 1. TOPLANTININ KONUSU
        // ═══════════════════════════════════════════════════════════════
        int block1Start = row;

        // Satır 1: Başlık & Toplantı Başlığı + Tarih
        ws.Cell(row, 1).Value = "TOPLANTININ KONUSU";
        ws.Range(row, 1, row, 2).Merge();
        ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 1).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);

        var dateStr = dto.MeetingDate?.ToString("dd.MM.yyyy") ?? "";
        var titleStr = !string.IsNullOrWhiteSpace(dto.Title) ? dto.Title : dto.Subject;
        var fullTitle = !string.IsNullOrWhiteSpace(dateStr) ? $"{titleStr} | {dateStr}" : titleStr;
        ws.Cell(row, 3).Value = fullTitle;
        ws.Cell(row, 3).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 3).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center).Alignment.SetWrapText(true);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(headerBg);
        ws.Row(row).Height = fullTitle.Length > 45 ? 32 : 24;
        row++;

        // Satır 2: Toplantı Yeri
        ws.Cell(row, 1).Value = 1;
        ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        ws.Cell(row, 2).Value = "Toplantı Yeri";
        ws.Cell(row, 3).Value = string.IsNullOrWhiteSpace(dto.LocationName) || dto.LocationName == "-" ? "" : dto.LocationName;
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
        ws.Row(row).Height = 20;
        row++;

        // Satır 3: Gün ve Saat
        ws.Cell(row, 1).Value = 2;
        ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        ws.Cell(row, 2).Value = "Gün ve Saat";
        var timeStr = dto.MeetingTime.HasValue ? $" - {dto.MeetingTime.Value:HH\\:mm}" : "";
        ws.Cell(row, 3).Value = $"{dateStr}{timeStr}".Trim(' ', '-');
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
        ws.Row(row).Height = 20;

        int block1End = row;
        // B ve C sütunları arasındaki dikey ayırıcı çizgi
        ws.Range(block1Start, 2, block1End, 2).Style.Border.SetRightBorder(thinBorder).Border.SetRightBorderColor(borderColor);
        // 1. Bloğun alt yatay ayırıcı çizgisi
        ws.Range(block1End, 1, block1End, 3).Style.Border.SetBottomBorder(sectionBorder).Border.SetBottomBorderColor(borderColor);
        row++;

        // ═══════════════════════════════════════════════════════════════
        // 2. KATILIMCILAR
        // ═══════════════════════════════════════════════════════════════
        int block2Start = row;

        ws.Cell(row, 1).Value = "KATILIMCILAR";
        ws.Range(row, 1, row, 2).Merge();
        ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 1).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);

        ws.Cell(row, 3).Value = "Ad ve Soyad";
        ws.Cell(row, 3).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 3).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(headerBg);
        ws.Row(row).Height = 24;

        // KATILIMCILAR başlık altı ince çizgi
        ws.Range(row, 1, row, 3).Style.Border.SetBottomBorder(thinBorder).Border.SetBottomBorderColor(borderColor);
        row++;

        if (dto.Participants.Count > 0)
        {
            int pIndex = 1;
            foreach (var p in dto.Participants)
            {
                ws.Cell(row, 1).Value = pIndex++;
                ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

                var comp = p.CompanyName;
                var roleOrTitle = !string.IsNullOrWhiteSpace(p.RoleName) && p.RoleName != "Belirtilmedi"
                    ? p.RoleName
                    : (!string.IsNullOrWhiteSpace(p.Title) ? p.Title : "");
                var leftDesc = string.Join(" ", new[] { comp, roleOrTitle }.Where(s => !string.IsNullOrWhiteSpace(s)));
                ws.Cell(row, 2).Value = string.IsNullOrWhiteSpace(leftDesc) ? "-" : leftDesc;
                ws.Cell(row, 2).Style.Alignment.SetWrapText(true);

                ws.Cell(row, 3).Value = p.FullName;
                ws.Cell(row, 3).Style.Alignment.SetWrapText(true);
                ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
                ws.Row(row).Height = 20;
                row++;
            }
        }
        else
        {
            ws.Cell(row, 1).Value = 1;
            ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            ws.Cell(row, 2).Value = "-";
            ws.Cell(row, 3).Value = "-";
            ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
            ws.Row(row).Height = 20;
            row++;
        }

        int block2End = row - 1;
        // B ve C sütunları arasındaki dikey ayırıcı çizgi
        ws.Range(block2Start, 2, block2End, 2).Style.Border.SetRightBorder(thinBorder).Border.SetRightBorderColor(borderColor);
        // 2. Bloğun alt yatay ayırıcı çizgisi
        ws.Range(block2End, 1, block2End, 3).Style.Border.SetBottomBorder(sectionBorder).Border.SetBottomBorderColor(borderColor);

        // ═══════════════════════════════════════════════════════════════
        // 3. TOPLANTI GÜNDEMİ
        // ═══════════════════════════════════════════════════════════════
        ws.Cell(row, 1).Value = "TOPLANTI GÜNDEMİ";
        ws.Range(row, 1, row, 3).Merge();
        ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 1).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(headerBg);
        ws.Row(row).Height = 24;
        row++;

        ws.Cell(row, 1).Value = 1;
        ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        var agendaText = !string.IsNullOrWhiteSpace(dto.Description)
            ? dto.Description
            : (!string.IsNullOrWhiteSpace(dto.Subject) ? dto.Subject : "-");
        ws.Cell(row, 2).Value = agendaText;
        ws.Range(row, 2, row, 3).Merge();
        ws.Cell(row, 2).Style.Alignment.SetWrapText(true);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
        int agendaLines = (int)Math.Max(1, Math.Ceiling((double)agendaText.Length / 95.0));
        ws.Row(row).Height = Math.Max(22, agendaLines * 18);

        int block3End = row;
        ws.Range(block3End, 1, block3End, 3).Style.Border.SetBottomBorder(sectionBorder).Border.SetBottomBorderColor(borderColor);
        row++;

        // ═══════════════════════════════════════════════════════════════
        // 4. NOTLAR (Eski Önemli Notlar - 1. sırada yer alır)
        // ═══════════════════════════════════════════════════════════════
        ws.Cell(row, 1).Value = "NOTLAR";
        ws.Range(row, 1, row, 3).Merge();
        ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 1).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(headerBg);
        ws.Row(row).Height = 24;
        row++;

        var regularNotes = dto.Notes.Where(n => n.NoteType != "DECISION").ToList();
        if (regularNotes.Count > 0)
        {
            int nIndex = 1;
            foreach (var n in regularNotes)
            {
                ws.Cell(row, 1).Value = nIndex++;
                ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

                var noteText = n.Content ?? "";
                if (n.ResponsiblePerson != null && !string.IsNullOrWhiteSpace(n.ResponsiblePerson.FullName))
                {
                    noteText += $" (Sorumlu: {n.ResponsiblePerson.FullName})";
                }
                ws.Cell(row, 2).Value = noteText;
                ws.Range(row, 2, row, 3).Merge();
                ws.Cell(row, 2).Style.Alignment.SetWrapText(true);
                ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
                int nLines = (int)Math.Max(1, Math.Ceiling((double)noteText.Length / 95.0));
                ws.Row(row).Height = Math.Max(20, nLines * 18);
                row++;
            }
        }
        else
        {
            ws.Cell(row, 1).Value = 1;
            ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            ws.Cell(row, 2).Value = "-";
            ws.Range(row, 2, row, 3).Merge();
            ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
            ws.Row(row).Height = 20;
            row++;
        }

        int block4End = row - 1;
        ws.Range(block4End, 1, block4End, 3).Style.Border.SetBottomBorder(sectionBorder).Border.SetBottomBorderColor(borderColor);

        // ═══════════════════════════════════════════════════════════════
        // 5. ALINAN KARARLAR (2. sırada yer alır)
        // ═══════════════════════════════════════════════════════════════
        ws.Cell(row, 1).Value = "ALINAN KARARLAR";
        ws.Range(row, 1, row, 3).Merge();
        ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 1).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(headerBg);
        ws.Row(row).Height = 24;
        row++;

        var decisions = dto.Notes.Where(n => n.NoteType == "DECISION").ToList();
        if (decisions.Count > 0)
        {
            int dIndex = 1;
            foreach (var d in decisions)
            {
                ws.Cell(row, 1).Value = dIndex++;
                ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                ws.Cell(row, 2).Value = d.Content;
                ws.Range(row, 2, row, 3).Merge();
                ws.Cell(row, 2).Style.Alignment.SetWrapText(true);
                ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
                int dLines = (int)Math.Max(1, Math.Ceiling((double)(d.Content?.Length ?? 0) / 95.0));
                ws.Row(row).Height = Math.Max(20, dLines * 18);
                row++;
            }
        }
        else
        {
            ws.Cell(row, 1).Value = 1;
            ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            ws.Cell(row, 2).Value = "-";
            ws.Range(row, 2, row, 3).Merge();
            ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
            ws.Row(row).Height = 20;
            row++;
        }

        int block5End = row - 1;
        ws.Range(block5End, 1, block5End, 3).Style.Border.SetBottomBorder(sectionBorder).Border.SetBottomBorderColor(borderColor);

        // ═══════════════════════════════════════════════════════════════
        // 6. BİR SONRAKİ TOPLANTI (3. sırada yer alır)
        // ═══════════════════════════════════════════════════════════════
        ws.Cell(row, 1).Value = "BİR SONRAKİ TOPLANTI";
        ws.Range(row, 1, row, 3).Merge();
        ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(10.5).Font.SetFontColor(headerFontColor);
        ws.Cell(row, 1).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(headerBg);
        ws.Row(row).Height = 24;
        row++;

        ws.Cell(row, 1).Value = 1;
        ws.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        string nextText = "-";
        if (dto.NextMeetingAt.HasValue)
        {
            nextText = dto.NextMeetingAt.Value.ToString("dd.MM.yyyy HH:mm");
            if (!string.IsNullOrWhiteSpace(dto.NextMeetingNote))
            {
                nextText += $" - {dto.NextMeetingNote}";
            }
        }
        ws.Cell(row, 2).Value = nextText;
        ws.Range(row, 2, row, 3).Merge();
        ws.Cell(row, 2).Style.Alignment.SetWrapText(true);
        ws.Range(row, 1, row, 3).Style.Fill.SetBackgroundColor(dataRowBg);
        ws.Row(row).Height = 22;

        int totalRows = row;

        // ═══════════════════════════════════════════════════════════════
        // Belge Geneli Format ve Kenarlıklar (Border)
        // ═══════════════════════════════════════════════════════════════
        var wholeRange = ws.Range(1, 1, totalRows, 3);
        wholeRange.Style.Font.SetFontName(fontName);
        wholeRange.Style.Font.SetFontSize(9.5);
        wholeRange.Style.Font.SetFontColor(XLColor.Black);
        wholeRange.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Top);

        // Belge dış çerçevesi: Kalın/Medium kenarlık
        wholeRange.Style.Border.SetOutsideBorder(sectionBorder);
        wholeRange.Style.Border.SetOutsideBorderColor(borderColor);

        // Yazdırma ve Sayfa Yapısı (A4 Dikey)
        ws.ShowGridLines = true;
        ws.PageSetup.PageOrientation = XLPageOrientation.Portrait;
        ws.PageSetup.PaperSize = XLPaperSize.A4Paper;
        ws.PageSetup.PagesWide = 1;
        ws.PageSetup.PagesTall = 0;
        ws.PageSetup.Margins.SetLeft(0.5);
        ws.PageSetup.Margins.SetRight(0.5);
        ws.PageSetup.Margins.SetTop(0.5);
        ws.PageSetup.Margins.SetBottom(0.5);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetxml.sheet", $"Tutanak_{dto.MeetingId}_{DateTime.Now:yyyyMMddHHmm}.xlsx");
    }

    [HttpGet("{id}/export/pdf")]
    public async Task<IActionResult> ExportToPdf(int id)
    {
        var dto = await GetExportDto(id);
        if (dto == null) return NotFound();

        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9.5f).FontFamily("Lato"));

                page.Content().Element(c => ComposeCorporatePdf(c, dto));

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Sayfa ").FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                    x.CurrentPageNumber().FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                    x.Span(" / ").FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                    x.TotalPages().FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                });
            });
        });

        var pdfData = document.GeneratePdf();
        return File(pdfData, "application/pdf", $"Tutanak_{dto.MeetingId}_{DateTime.Now:yyyyMMddHHmm}.pdf");
    }

    // ──────────── Kurumsal PDF Düzeni (Web Önizleme & Excel ile Birebir) ────────────
    private static void ComposeCorporatePdf(IContainer container, MeetingMinutesExportDto dto)
    {
        var borderColor = "#4B5563";
        var headerBg = "#E2E8F0";
        var dataBg = "#F8FAFC";

        var dateStr = dto.MeetingDate?.ToString("dd.MM.yyyy") ?? "";
        var timeStr = dto.MeetingTime.HasValue ? $" - {dto.MeetingTime.Value:HH\\:mm}" : "";
        var titleStr = !string.IsNullOrWhiteSpace(dto.Title) ? dto.Title : dto.Subject;
        var fullTitle = !string.IsNullOrWhiteSpace(dateStr) ? $"{titleStr} | {dateStr}" : titleStr;
        var agendaText = !string.IsNullOrWhiteSpace(dto.Description) ? dto.Description : (!string.IsNullOrWhiteSpace(dto.Subject) ? dto.Subject : "-");

        var regularNotes = dto.Notes.Where(n => n.NoteType != "DECISION").ToList();
        var decisions = dto.Notes.Where(n => n.NoteType == "DECISION").ToList();

        container.Border(1.5f).BorderColor(borderColor).Column(col =>
        {
            // ── 1. TOPLANTININ KONUSU ──
            col.Item().BorderBottom(1.5f).BorderColor(borderColor).Row(row =>
            {
                // Sol Sütun (Başlık, Yer, Gün-Saat)
                row.RelativeItem(5.5f).BorderRight(0.75f).BorderColor(borderColor).Column(leftCol =>
                {
                    leftCol.Item().Background(headerBg).Padding(6).Text("TOPLANTININ KONUSU").Bold().FontSize(10);
                    leftCol.Item().Background(dataBg).Padding(5).Row(r =>
                    {
                        r.ConstantItem(18).AlignCenter().Text("1").FontSize(9);
                        r.RelativeItem().Text("Toplantı Yeri").FontSize(9);
                    });
                    leftCol.Item().Background(dataBg).Padding(5).Row(r =>
                    {
                        r.ConstantItem(18).AlignCenter().Text("2").FontSize(9);
                        r.RelativeItem().Text("Gün ve Saat").FontSize(9);
                    });
                });

                // Sağ Sütun (Değerler)
                row.RelativeItem(4.5f).Column(rightCol =>
                {
                    rightCol.Item().Background(headerBg).Padding(6).Text(fullTitle).Bold().FontSize(10);
                    rightCol.Item().Background(dataBg).Padding(5).Text(string.IsNullOrWhiteSpace(dto.LocationName) || dto.LocationName == "-" ? "-" : dto.LocationName).FontSize(9);
                    rightCol.Item().Background(dataBg).Padding(5).Text($"{dateStr}{timeStr}".Trim(' ', '-')).FontSize(9);
                });
            });

            // ── 2. KATILIMCILAR ──
            col.Item().BorderBottom(1.5f).BorderColor(borderColor).Column(partCol =>
            {
                // Başlık Satırı
                partCol.Item().BorderBottom(0.75f).BorderColor(borderColor).Row(headerRow =>
                {
                    headerRow.RelativeItem(5.5f).BorderRight(0.75f).BorderColor(borderColor).Background(headerBg).Padding(6).Text("KATILIMCILAR").Bold().FontSize(10);
                    headerRow.RelativeItem(4.5f).Background(headerBg).Padding(6).Text("Ad ve Soyad").Bold().FontSize(10);
                });

                if (dto.Participants.Count > 0)
                {
                    int pIndex = 1;
                    foreach (var p in dto.Participants)
                    {
                        var comp = p.CompanyName;
                        var roleOrTitle = !string.IsNullOrWhiteSpace(p.RoleName) && p.RoleName != "Belirtilmedi"
                            ? p.RoleName
                            : (!string.IsNullOrWhiteSpace(p.Title) ? p.Title : "");
                        var leftDesc = string.Join(" ", new[] { comp, roleOrTitle }.Where(s => !string.IsNullOrWhiteSpace(s)));

                        int curIdx = pIndex++;
                        partCol.Item().Background(dataBg).Row(pRow =>
                        {
                            pRow.RelativeItem(5.5f).BorderRight(0.75f).BorderColor(borderColor).Padding(4).Row(r =>
                            {
                                r.ConstantItem(18).AlignCenter().Text(curIdx.ToString()).FontSize(9);
                                r.RelativeItem().Text(string.IsNullOrWhiteSpace(leftDesc) ? "-" : leftDesc).FontSize(9);
                            });
                            pRow.RelativeItem(4.5f).Padding(4).Text(p.FullName).FontSize(9);
                        });
                    }
                }
                else
                {
                    partCol.Item().Background(dataBg).Row(pRow =>
                    {
                        pRow.RelativeItem(5.5f).BorderRight(0.75f).BorderColor(borderColor).Padding(4).Row(r =>
                        {
                            r.ConstantItem(18).AlignCenter().Text("1").FontSize(9);
                            r.RelativeItem().Text("-").FontSize(9);
                        });
                        pRow.RelativeItem(4.5f).Padding(4).Text("-").FontSize(9);
                    });
                }
            });

            // ── 3. TOPLANTI GÜNDEMİ ──
            col.Item().BorderBottom(1.5f).BorderColor(borderColor).Column(agCol =>
            {
                agCol.Item().Background(headerBg).Padding(6).Text("TOPLANTI GÜNDEMİ").Bold().FontSize(10);
                agCol.Item().Background(dataBg).Padding(5).Row(r =>
                {
                    r.ConstantItem(18).AlignCenter().Text("1").FontSize(9);
                    r.RelativeItem().Text(agendaText).FontSize(9);
                });
            });

            // ── 4. NOTLAR (Eski Önemli Notlar - 1. sırada yer alır) ──
            col.Item().BorderBottom(1.5f).BorderColor(borderColor).Column(notesCol =>
            {
                notesCol.Item().Background(headerBg).Padding(6).Text("NOTLAR").Bold().FontSize(10);
                if (regularNotes.Count > 0)
                {
                    int nIdx = 1;
                    foreach (var n in regularNotes)
                    {
                        var noteText = n.Content ?? "";
                        if (n.ResponsiblePerson != null && !string.IsNullOrWhiteSpace(n.ResponsiblePerson.FullName))
                        {
                            noteText += $" (Sorumlu: {n.ResponsiblePerson.FullName})";
                        }
                        int cur = nIdx++;
                        notesCol.Item().Background(dataBg).Padding(4).Row(r =>
                        {
                            r.ConstantItem(18).AlignCenter().Text(cur.ToString()).FontSize(9);
                            r.RelativeItem().Text(noteText).FontSize(9);
                        });
                    }
                }
                else
                {
                    notesCol.Item().Background(dataBg).Padding(4).Row(r =>
                    {
                        r.ConstantItem(18).AlignCenter().Text("1").FontSize(9);
                        r.RelativeItem().Text("-").FontSize(9);
                    });
                }
            });

            // ── 5. ALINAN KARARLAR (2. sırada yer alır) ──
            col.Item().BorderBottom(1.5f).BorderColor(borderColor).Column(decCol =>
            {
                decCol.Item().Background(headerBg).Padding(6).Text("ALINAN KARARLAR").Bold().FontSize(10);
                if (decisions.Count > 0)
                {
                    int dIdx = 1;
                    foreach (var d in decisions)
                    {
                        int cur = dIdx++;
                        decCol.Item().Background(dataBg).Padding(4).Row(r =>
                        {
                            r.ConstantItem(18).AlignCenter().Text(cur.ToString()).FontSize(9);
                            r.RelativeItem().Text(d.Content ?? "-").FontSize(9);
                        });
                    }
                }
                else
                {
                    decCol.Item().Background(dataBg).Padding(4).Row(r =>
                    {
                        r.ConstantItem(18).AlignCenter().Text("1").FontSize(9);
                        r.RelativeItem().Text("-").FontSize(9);
                    });
                }
            });

            // ── 6. BİR SONRAKİ TOPLANTI (3. sırada yer alır) ──
            col.Item().Column(nextCol =>
            {
                nextCol.Item().Background(headerBg).Padding(6).Text("BİR SONRAKİ TOPLANTI").Bold().FontSize(10);
                string nextText = "-";
                if (dto.NextMeetingAt.HasValue)
                {
                    nextText = dto.NextMeetingAt.Value.ToString("dd.MM.yyyy HH:mm");
                    if (!string.IsNullOrWhiteSpace(dto.NextMeetingNote))
                    {
                        nextText += $" - {dto.NextMeetingNote}";
                    }
                }
                nextCol.Item().Background(dataBg).Padding(5).Row(r =>
                {
                    r.ConstantItem(18).AlignCenter().Text("1").FontSize(9);
                    r.RelativeItem().Text(nextText).FontSize(9);
                });
            });
        });
    }

    // ──────────── Meeting Attachments Endpoints (Kartvizit & Toplantı Görselleri) ────────────
    [HttpGet("{id}/attachments")]
    public async Task<ActionResult<List<AttachmentResponseDto>>> GetAttachments(int id, [FromQuery] string? category = null)
    {
        var meetingExists = await _db.Meetings.AnyAsync(m => m.Id == id && !m.IsDeleted);
        if (!meetingExists) return NotFound("Toplantı bulunamadı.");

        var query = _db.Attachments
            .Include(a => a.UploadedByUser)
            .Where(a => a.EntityType == "MEETING" && a.EntityId == id && !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Category == category);
        }

        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttachmentResponseDto
            {
                Id = a.Id,
                MeetingId = a.EntityId,
                Category = a.Category ?? "MEETING_PHOTO",
                FileName = a.FileName,
                MimeType = a.MimeType,
                FileSizeBytes = a.FileSizeBytes,
                Description = a.Description,
                UploadedByName = a.UploadedByUser != null ? a.UploadedByUser.FullName : "Sistem",
                CreatedAt = a.CreatedAt,
                Url = $"/api/meetings/{id}/attachments/{a.Id}/file"
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("{id}/attachments")]
    public async Task<ActionResult<AttachmentResponseDto>> UploadAttachment(
        int id,
        [FromForm] IFormFile? file,
        [FromForm] string? category = "MEETING_PHOTO",
        [FromForm] string? description = null)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Lütfen geçerli bir dosya seçin.");

        var meetingExists = await _db.Meetings.AnyAsync(m => m.Id == id && !m.IsDeleted);
        if (!meetingExists) return NotFound("Toplantı bulunamadı.");

        var validCategory = category?.ToUpperInvariant() == "BUSINESS_CARD" ? "BUSINESS_CARD" : "MEETING_PHOTO";

        var uploadsFolder = Path.Combine(AppContext.BaseDirectory, "uploads", "meetings", id.ToString());
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var ext = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var attachment = new Attachment
        {
            EntityType = "MEETING",
            EntityId = id,
            Category = validCategory,
            FileName = file.FileName,
            FileExtension = ext,
            FileSizeBytes = file.Length,
            MimeType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            StoragePath = filePath,
            Description = description,
            UploadedBy = CurrentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _db.Attachments.Add(attachment);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(CurrentUserId);

        var dto = new AttachmentResponseDto
        {
            Id = attachment.Id,
            MeetingId = id,
            Category = attachment.Category,
            FileName = attachment.FileName,
            MimeType = attachment.MimeType,
            FileSizeBytes = attachment.FileSizeBytes,
            Description = attachment.Description,
            UploadedByName = user?.FullName ?? "Sistem",
            CreatedAt = attachment.CreatedAt,
            Url = $"/api/meetings/{id}/attachments/{attachment.Id}/file"
        };

        return Ok(dto);
    }

    [HttpDelete("{id}/attachments/{attachmentId}")]
    public async Task<IActionResult> DeleteAttachment(int id, int attachmentId)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.EntityType == "MEETING" && a.EntityId == id && !a.IsDeleted);
        if (attachment == null) return NotFound("Ek dosya bulunamadı.");

        attachment.IsDeleted = true;
        attachment.DeletedAt = DateTime.UtcNow;
        attachment.DeletedBy = CurrentUserId;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/attachments/{attachmentId}/file")]
    public async Task<IActionResult> GetAttachmentFile(int id, int attachmentId)
    {
        var attachment = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.EntityType == "MEETING" && a.EntityId == id && !a.IsDeleted);
        if (attachment == null) return NotFound("Ek dosya bulunamadı.");

        if (!System.IO.File.Exists(attachment.StoragePath))
            return NotFound("Dosya sunucu diskinde bulunamadı.");

        return PhysicalFile(attachment.StoragePath, attachment.MimeType, attachment.FileName);
    }
}
