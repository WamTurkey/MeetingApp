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
public class MeetingsController : ControllerBase
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

        var participant = new MeetingParticipant
        {
            MeetingId = id,
            PersonId = dto.PersonId,
            Role = dto.Role,
            IsAttended = true, // Default as requested
            CreatedBy = 1
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
        p.UpdatedBy = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");
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
            CreatedBy = 1
        };
        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        // ────────────────────────────
        // TAKİP/TERMİN ENTEGRASYONU (bkz. NoteFollowupSync kuralları)
        // ────────────────────────────
        await NoteFollowupSync.SyncFromNoteAsync(_db, note, note.CreatedBy);
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
        note.UpdatedBy = 1;
        note.UpdatedAt = DateTime.UtcNow;

        // ────────────────────────────
        // TAKİP/TERMİN ENTEGRASYONU GÜNCELLEMESİ — tek SaveChanges ile atomik
        // (Eski satır içi mantık "CLOSED" gibi LK_ActionStatus'ta olmayan bir kod yazıp FK hatasına yol açıyordu.)
        // ────────────────────────────
        await NoteFollowupSync.SyncFromNoteAsync(_db, note, 1);
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
        // Bağlı takip kaydı da soft-delete (Takip & Terminler'de "hayalet" kayıt kalmasın)
        await NoteFollowupSync.CascadeDeleteAsync(_db, note.Id, 1);
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
            MeetingDate = m.MeetingDate,
            MeetingTime = m.PlannedStart,
            LocationName = m.Location?.Name ?? "-",
            ProjectName = m.Project?.Name ?? "-",
            CategoryName = m.Category?.Name ?? "-",
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

        ws.Cell("A1").Value = "TOPLANTI TUTANAĞI";
        ws.Range("A1:E1").Merge().Style
            .Font.SetBold().Font.SetFontSize(16)
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
            .Fill.SetBackgroundColor(XLColor.LightGray);

        ws.Cell("A2").Value = "Toplantı Konusu:";
        ws.Cell("B2").Value = dto.Title;
        ws.Range("B2:E2").Merge();
        
        ws.Cell("A3").Value = "Tarih / Saat:";
        ws.Cell("B3").Value = dto.MeetingDate?.ToString("dd.MM.yyyy") + (dto.MeetingTime.HasValue ? $" / {dto.MeetingTime.Value.ToString("HH\\:mm")}" : "");
        ws.Range("B3:E3").Merge();

        ws.Cell("A4").Value = "Yer:";
        ws.Cell("B4").Value = dto.LocationName;
        ws.Range("B4:E4").Merge();

        ws.Cell("A5").Value = "Proje / Kategori:";
        ws.Cell("B5").Value = $"{dto.ProjectName} / {dto.CategoryName}";
        ws.Range("B5:E5").Merge();

        ws.Range("A2:E5").Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Range("A2:A5").Style.Font.SetBold();

        int row = 7;

        ws.Cell(row, 1).Value = "KATILIMCILAR";
        ws.Range(row, 1, row, 5).Merge().Style
            .Font.SetBold().Fill.SetBackgroundColor(XLColor.LightSteelBlue);
        row++;

        if (dto.InternalParticipants.Any())
        {
            foreach (var g in dto.InternalParticipants)
            {
                ws.Cell(row, 1).Value = g.CompanyName ?? "-";
                ws.Cell(row, 1).Style.Font.SetBold(true);
                
                ws.Cell(row, 2).Value = g.ParticipantsText ?? "-";
                ws.Cell(row, 2).Style.Alignment.SetWrapText(true);
                
                ws.Range(row, 2, row, 5).Merge();
                ws.Range(row, 1, row, 5).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
                row++;
            }
        }

        if (dto.ExternalParticipants.Any())
        {
            ws.Cell(row, 1).Value = "Firma";
            ws.Cell(row, 2).Value = "Ünvan";
            ws.Cell(row, 3).Value = "Ad Soyad";
            ws.Range(row, 3, row, 5).Merge();
            ws.Range(row, 1, row, 5).Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.WhiteSmoke).Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
            row++;

            foreach (var p in dto.ExternalParticipants)
            {
                ws.Cell(row, 1).Value = p.CompanyName ?? "-";
                ws.Cell(row, 2).Value = p.Title ?? "-";
                ws.Cell(row, 3).Value = p.FullName ?? "-";
                ws.Range(row, 3, row, 5).Merge();
                ws.Range(row, 1, row, 5).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
                row++;
            }
        }

        if (!dto.InternalParticipants.Any() && !dto.ExternalParticipants.Any())
        {
            ws.Cell(row, 1).Value = "Katılımcı kaydı bulunmamaktadır.";
            ws.Range(row, 1, row, 5).Merge().Style.Font.SetItalic().Font.SetFontColor(XLColor.Gray);
            row++;
        }

        row++;

        ws.Cell(row, 1).Value = "GÜNDEM VE KARARLAR";
        ws.Range(row, 1, row, 5).Merge().Style
            .Font.SetBold().Fill.SetBackgroundColor(XLColor.LightSteelBlue);
        row++;

        ws.Cell(row, 1).Value = "Sırano";
        ws.Cell(row, 2).Value = "Tip";
        ws.Cell(row, 3).Value = "İçerik";
        ws.Cell(row, 4).Value = "Sorumlu";
        ws.Cell(row, 5).Value = "Termin";
        ws.Range(row, 1, row, 5).Style.Font.SetBold().Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
        row++;

        int seq = 1;
        foreach (var note in dto.Notes)
        {
            ws.Cell(row, 1).Value = seq++;
            ws.Cell(row, 2).Value = note.NoteTypeNavigation?.DisplayName ?? "-";
            ws.Cell(row, 3).Value = note.Content ?? string.Empty;
            ws.Cell(row, 4).Value = note.ResponsiblePerson?.FullName ?? "-";
            ws.Cell(row, 5).Value = note.DueDate?.ToString("dd.MM.yyyy") ?? "-";
            
            ws.Cell(row, 3).Style.Alignment.SetWrapText(true);
            
            ws.Range(row, 1, row, 5).Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin).Border.SetInsideBorder(XLBorderStyleValues.Thin);
            ws.Range(row, 1, row, 5).Style.Alignment.SetVertical(XLAlignmentVerticalValues.Top);
            
            row++;
        }

        if (dto.Notes.Count == 0)
        {
            ws.Cell(row, 1).Value = "Gündem maddesi bulunmamaktadır.";
            ws.Range(row, 1, row, 5).Merge().Style.Font.SetItalic().Font.SetFontColor(XLColor.Gray);
            row++;
        }

        ws.Column(1).Width = 8;
        ws.Column(2).Width = 20;
        ws.Column(3).Width = 50;
        ws.Column(4).Width = 20;
        ws.Column(5).Width = 15;

        ws.Style.Font.FontName = "Calibri";
        ws.Style.Font.FontSize = 11;

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
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Lato"));

                page.Header().Element(c => ComposeHeader(c, dto));
                page.Content().Element(c => ComposeContent(c, dto));
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Sayfa ");
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        var pdfData = document.GeneratePdf();
        return File(pdfData, "application/pdf", $"Tutanak_{dto.MeetingId}_{DateTime.Now:yyyyMMddHHmm}.pdf");
    }

    // ──────────── PDF yardımcıları ────────────

    /// <summary>QuestPDF Text/Span null kabul etmez → boş/null değerler için güvenli fallback.</summary>
    private static string Safe(string? value, string fallback = "-") =>
        string.IsNullOrWhiteSpace(value) ? fallback : value;

    /// <summary>Bu uzunluğun altındaki satırlar sayfalar arasında bölünmez (bütün halinde bir sonraki sayfaya taşınır).</summary>
    private const int AtomicRowCharLimit = 700;

    private static IContainer HeaderCellStyle(IContainer c) =>
        c.Background(Colors.Grey.Lighten3).BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(4).PaddingHorizontal(3);

    private static IContainer BodyCellStyle(IContainer c, string bg) =>
        c.Background(bg).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(3).PaddingHorizontal(3);

    private static void ComposeEmptyNotice(IContainer container, string message) =>
        container.Border(0.5f).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5)
            .Padding(8).AlignCenter().Text(message).Italic().FontColor(Colors.Grey.Darken1);

    private void ComposeHeader(IContainer container, MeetingMinutesExportDto dto)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("TOPLANTI TUTANAĞI").FontSize(18).SemiBold().FontColor(Colors.Blue.Darken2);
                col.Item().PaddingTop(5).Text(text =>
                {
                    text.Span("Konu: ").SemiBold();
                    text.Span(Safe(dto.Title));
                });
                col.Item().Text(text =>
                {
                    text.Span("Tarih / Saat: ").SemiBold();
                    var datePart = dto.MeetingDate?.ToString("dd.MM.yyyy") ?? "-";
                    var timePart = dto.MeetingTime.HasValue ? $" / {dto.MeetingTime.Value:HH\\:mm}" : "";
                    text.Span(datePart + timePart);
                });
                col.Item().Text(text =>
                {
                    text.Span("Yer: ").SemiBold();
                    text.Span(Safe(dto.LocationName));
                });
            });
        });
    }

    private void ComposeContent(IContainer container, MeetingMinutesExportDto dto)
    {
        var internals = dto.InternalParticipants ?? new List<InternalParticipantGroupDto>();
        var externals = dto.ExternalParticipants ?? new List<ExternalParticipantDto>();
        var notes = dto.Notes ?? new List<Note>();

        container.PaddingVertical(1, Unit.Centimetre).Column(col =>
        {
            col.Spacing(15);
            
            // ── Participants ──
            // EnsureSpace: başlık sayfanın en altında "yetim" kalmasın, en az birkaç satır sığacak alan olsun
            col.Item().EnsureSpace(60).Text("KATILIMCILAR").FontSize(12).SemiBold().FontColor(Colors.Grey.Darken3);

            if (!internals.Any() && !externals.Any())
            {
                col.Item().Element(c => ComposeEmptyNotice(c, "Katılımcı kaydı bulunmamaktadır."));
            }
            
            if (internals.Any())
            {
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(7);
                    });

                    foreach (var ip in internals)
                    {
                        // Kısa satırlar bölünmez
                        table.Cell().ShowEntire().Element(c => BodyCellStyle(c, Colors.White)).Text(Safe(ip.CompanyName)).SemiBold();
                        table.Cell().ShowEntire().Element(c => BodyCellStyle(c, Colors.White)).Text(Safe(ip.ParticipantsText));
                    }
                });
            }

            if (externals.Any())
            {
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(4);
                    });

                    // Header her yeni sayfada otomatik tekrarlanır
                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderCellStyle).Text("Firma").SemiBold();
                        header.Cell().Element(HeaderCellStyle).Text("Ünvan").SemiBold();
                        header.Cell().Element(HeaderCellStyle).Text("Ad Soyad").SemiBold();
                    });

                    int index = 0;
                    foreach (var ep in externals)
                    {
                        var bgColor = index % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;
                        table.Cell().ShowEntire().Element(c => BodyCellStyle(c, bgColor)).Text(Safe(ep.CompanyName));
                        table.Cell().ShowEntire().Element(c => BodyCellStyle(c, bgColor)).Text(Safe(ep.Title));
                        table.Cell().ShowEntire().Element(c => BodyCellStyle(c, bgColor)).Text(Safe(ep.FullName));
                        index++;
                    }
                });
            }

            // ── Meeting Items ──
            col.Item().PaddingTop(10).EnsureSpace(80).Text("GÜNDEM VE KARARLAR").FontSize(12).SemiBold().FontColor(Colors.Grey.Darken3);

            if (notes.Count == 0)
            {
                col.Item().Element(c => ComposeEmptyNotice(c, "Gündem maddesi bulunmamaktadır."));
                return;
            }
            
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(22);
                    columns.ConstantColumn(55);
                    columns.RelativeColumn();
                    columns.ConstantColumn(75);
                    columns.ConstantColumn(60);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCellStyle).Text("#").SemiBold();
                    header.Cell().Element(HeaderCellStyle).Text("Tip").SemiBold();
                    header.Cell().Element(HeaderCellStyle).Text("İçerik").SemiBold();
                    header.Cell().Element(HeaderCellStyle).Text("Sorumlu").SemiBold();
                    header.Cell().Element(HeaderCellStyle).Text("Termin").SemiBold();
                });

                int index = 0;
                int seq = 1;
                foreach (var note in notes)
                {
                    var bgColor = index % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;
                    var content = note.Content ?? string.Empty;

                    // Page-break kuralı:
                    //  • Normal uzunluktaki satırlar ShowEntire ile bütün halinde tutulur → hücre ortadan bölünmez,
                    //    satır sığmıyorsa tamamı sonraki sayfaya geçer (tablo başlığı tekrar eder).
                    //  • Tek sayfaya sığmayacak kadar uzun içerikte ShowEntire layout hatası verir; bu durumda
                    //    yalnızca EnsureSpace uygulanır (en az birkaç satır sığmıyorsa yeni sayfadan başlar).
                    var isAtomic = content.Length <= AtomicRowCharLimit;
                    IContainer Cell() => isAtomic
                        ? table.Cell().ShowEntire().Element(c => BodyCellStyle(c, bgColor))
                        : table.Cell().EnsureSpace(60).Element(c => BodyCellStyle(c, bgColor));

                    Cell().Text(seq.ToString());
                    Cell().Text(Safe(note.NoteTypeNavigation?.DisplayName));
                    Cell().Text(Safe(content, ""));
                    Cell().Text(Safe(note.ResponsiblePerson?.FullName));
                    Cell().Text(note.DueDate?.ToString("dd.MM.yyyy") ?? "-");
                    index++;
                    seq++;
                }
            });
        });
    }
}
