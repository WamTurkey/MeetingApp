using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Business;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FollowupsController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public FollowupsController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<FollowupItemDto>>> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int? sourceMeetingId = null)
    {
        var query = _db.FollowupItems
            .Include(f => f.ResponsiblePerson)
            .Include(f => f.ResponsibleCompany)
            .Include(f => f.ActionStatusNavigation)
            .Include(f => f.SourceMeeting)
            .Include(f => f.DependentOn)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(f => f.ActionStatus == status);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(f => f.Text.Contains(search));
        if (sourceMeetingId.HasValue)
            query = query.Where(f => f.SourceMeetingId == sourceMeetingId.Value);

        var items = await query
            .OrderByDescending(f => f.DueDate.HasValue)
            .ThenBy(f => f.DueDate)
            .Select(f => new FollowupItemDto(
                f.Id, f.Text, f.TopicId,
                f.ResponsiblePersonId, f.ResponsiblePerson != null ? f.ResponsiblePerson.FullName : null,
                f.ResponsibleCompanyId, f.ResponsibleCompany != null ? f.ResponsibleCompany.Name : null,
                f.DueDate.HasValue ? f.DueDate.Value.ToString("yyyy-MM-dd") : null,
                f.ActionStatus, f.ActionStatusNavigation.DisplayName,
                f.CompletedOn.HasValue ? f.CompletedOn.Value.ToString("yyyy-MM-dd") : null,
                f.WaitingReason, f.DevelopmentNote,
                f.DependentOn.Select(d => d.DependsOnItemId).ToList(), f.SourceMeetingId,
                f.SourceMeeting != null ? f.SourceMeeting.Title : null,
                f.SourceNoteId, f.Version,
                f.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                f.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss")))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FollowupItemDto>> GetById(int id)
    {
        var f = await _db.FollowupItems
            .Include(x => x.ResponsiblePerson)
            .Include(x => x.ResponsibleCompany)
            .Include(x => x.ActionStatusNavigation)
            .Include(x => x.SourceMeeting)
            .Include(x => x.DependentOn)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (f == null) return NotFound();

        return Ok(new FollowupItemDto(
            f.Id, f.Text, f.TopicId,
            f.ResponsiblePersonId, f.ResponsiblePerson?.FullName,
            f.ResponsibleCompanyId, f.ResponsibleCompany?.Name,
            f.DueDate?.ToString("yyyy-MM-dd"),
            f.ActionStatus, f.ActionStatusNavigation.DisplayName,
            f.CompletedOn?.ToString("yyyy-MM-dd"),
            f.WaitingReason, f.DevelopmentNote,
            f.DependentOn.Select(d => d.DependsOnItemId).ToList(), f.SourceMeetingId, f.SourceMeeting?.Title,
            f.SourceNoteId, f.Version,
            f.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
            f.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ss")));
    }

    [HttpPost]
    public async Task<ActionResult<FollowupItemDto>> Create([FromBody] CreateFollowupItemDto dto)
    {
        var item = new FollowupItem
        {
            Text = dto.Text, TopicId = dto.TopicId,
            ResponsiblePersonId = dto.ResponsiblePersonId,
            ResponsibleCompanyId = dto.ResponsibleCompanyId,
            DueDate = !string.IsNullOrEmpty(dto.DueDate) ? DateOnly.Parse(dto.DueDate) : null,
            WaitingReason = dto.WaitingReason, DevelopmentNote = dto.DevelopmentNote,
            SourceMeetingId = dto.SourceMeetingId, SourceNoteId = dto.SourceNoteId,
            ActionStatus = dto.ActionStatus ?? "OPEN",
            CreatedBy = 1
        };
        _db.FollowupItems.Add(item);
        await _db.SaveChangesAsync(); // Id atanması için önce kaydet

        if (dto.DependencyItemIds != null && dto.DependencyItemIds.Any())
        {
            foreach (var depId in dto.DependencyItemIds)
            {
                _db.FollowupItemDependencies.Add(new FollowupItemDependency
                {
                    ItemId = item.Id,
                    DependsOnItemId = depId
                });
            }
            await _db.SaveChangesAsync();
        }

        // Log oluşturma — artık item.Id geçerli
        _db.FollowupChangeLogs.Add(new FollowupChangeLog
        {
            FollowupId = item.Id, Action = "CREATE",
            Description = "Takip maddesi oluşturuldu", ChangedBy = 1
        });
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, await GetByIdInternal(item.Id));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FollowupItemDto>> Update(int id, [FromBody] UpdateFollowupItemDto dto)
    {
        var f = await _db.FollowupItems.Include(x => x.DependentOn).FirstOrDefaultAsync(x => x.Id == id);
        if (f == null) return NotFound();

        // Değişiklik logları
        void LogChange(string field, string? oldVal, string? newVal, string? description = null)
        {
            if (oldVal != newVal)
                _db.FollowupChangeLogs.Add(new FollowupChangeLog
                {
                    FollowupId = id, Action = "UPDATE", FieldName = field,
                    OldValue = oldVal, NewValue = newVal,
                    Description = description ?? $"{field} güncellendi", ChangedBy = 1
                });
        }

        LogChange("Text", f.Text, dto.Text, "Konu metni güncellendi");
        LogChange("ActionStatus", f.ActionStatus, dto.ActionStatus, "Durum güncellendi");
        LogChange("DueDate", f.DueDate?.ToString("yyyy-MM-dd"), dto.DueDate, "Termin tarihi güncellendi");
        LogChange("CompletedOn", f.CompletedOn?.ToString("yyyy-MM-dd"), dto.CompletedOn, "Tamamlanma tarihi güncellendi");
        LogChange("WaitingReason", f.WaitingReason, dto.WaitingReason, "Bekleme nedeni güncellendi");
        LogChange("DevelopmentNote", f.DevelopmentNote, dto.DevelopmentNote, "Gelişme notu güncellendi");

        // Sorumlu Kişi — ID→İsim çevirisi
        if (f.ResponsiblePersonId != dto.ResponsiblePersonId)
        {
            string? oldName = null, newName = null;
            if (f.ResponsiblePersonId.HasValue)
                oldName = (await _db.Persons.FindAsync(f.ResponsiblePersonId.Value))?.FullName ?? f.ResponsiblePersonId.ToString();
            if (dto.ResponsiblePersonId.HasValue)
                newName = (await _db.Persons.FindAsync(dto.ResponsiblePersonId.Value))?.FullName ?? dto.ResponsiblePersonId.ToString();
            LogChange("ResponsiblePerson", oldName, newName, "Sorumlu kişi güncellendi");
        }

        // Sorumlu Firma — ID→İsim çevirisi
        if (f.ResponsibleCompanyId != dto.ResponsibleCompanyId)
        {
            string? oldComp = null, newComp = null;
            if (f.ResponsibleCompanyId.HasValue)
                oldComp = (await _db.Companies.FindAsync(f.ResponsibleCompanyId.Value))?.Name ?? f.ResponsibleCompanyId.ToString();
            if (dto.ResponsibleCompanyId.HasValue)
                newComp = (await _db.Companies.FindAsync(dto.ResponsibleCompanyId.Value))?.Name ?? dto.ResponsibleCompanyId.ToString();
            LogChange("ResponsibleCompany", oldComp, newComp, "Sorumlu firma güncellendi");
        }

        // Bağımlılıklar (Dependencies) değişikliği
        var oldDepIds = f.DependentOn.Select(d => d.DependsOnItemId).OrderBy(x => x).ToList();
        var newDepIds = (dto.DependencyItemIds ?? new List<int>()).Where(d => d != id).Distinct().OrderBy(x => x).ToList();
        if (!oldDepIds.SequenceEqual(newDepIds))
        {
            // Resolve names for readability
            var allDepIds = oldDepIds.Union(newDepIds).Distinct().ToList();
            var depItems = await _db.FollowupItems
                .Where(x => allDepIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Text })
                .ToListAsync();
            string ResolveDeps(List<int> ids) => string.Join(", ", ids.Select(i => {
                var item = depItems.FirstOrDefault(d => d.Id == i);
                return item != null ? $"#{i} {(item.Text.Length > 30 ? item.Text[..30] + "..." : item.Text)}" : $"#{i}";
            }));
            LogChange("Dependencies", 
                oldDepIds.Any() ? ResolveDeps(oldDepIds) : null, 
                newDepIds.Any() ? ResolveDeps(newDepIds) : null,
                "Bağımlılıklar güncellendi");
        }

        f.Text = dto.Text; f.TopicId = dto.TopicId;
        f.ResponsiblePersonId = dto.ResponsiblePersonId;
        f.ResponsibleCompanyId = dto.ResponsibleCompanyId;
        f.DueDate = !string.IsNullOrEmpty(dto.DueDate) ? DateOnly.Parse(dto.DueDate) : null;
        f.ActionStatus = dto.ActionStatus;
        f.CompletedOn = !string.IsNullOrEmpty(dto.CompletedOn) ? DateOnly.Parse(dto.CompletedOn) : null;
        f.WaitingReason = dto.WaitingReason;
        f.DevelopmentNote = dto.DevelopmentNote;
        
        // Update dependencies
        _db.FollowupItemDependencies.RemoveRange(f.DependentOn);
        if (dto.DependencyItemIds != null && dto.DependencyItemIds.Any())
        {
            // Simple cycle check: A dependency cannot be the item itself
            var deps = dto.DependencyItemIds.Where(d => d != id).Distinct().ToList();
            foreach (var depId in deps)
            {
                _db.FollowupItemDependencies.Add(new FollowupItemDependency
                {
                    ItemId = id,
                    DependsOnItemId = depId
                });
            }
        }

        f.UpdatedBy = 1; f.UpdatedAt = DateTime.UtcNow; f.Version++;

        await _db.SaveChangesAsync();
        return Ok(await GetByIdInternal(id));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var f = await _db.FollowupItems.FindAsync(id);
        if (f == null) return NotFound();
        f.IsDeleted = true; f.DeletedAt = DateTime.UtcNow; f.DeletedBy = 1;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/changelog")]
    public async Task<ActionResult<List<FollowupChangeLogDto>>> GetChangeLogs(int id)
    {
        var logs = await _db.FollowupChangeLogs
            .Include(l => l.ChangedByUser)
            .Where(l => l.FollowupId == id)
            .OrderByDescending(l => l.ChangedAt)
            .Select(l => new FollowupChangeLogDto(
                l.Id, l.Action, l.FieldName, l.OldValue, l.NewValue,
                l.Description, l.ChangedBy, l.ChangedByUser.FullName,
                l.ChangedAt.ToString("yyyy-MM-ddTHH:mm:ss")))
            .ToListAsync();
        return Ok(logs);
    }

    private async Task<FollowupItemDto?> GetByIdInternal(int id)
    {
        var result = await GetById(id);
        return result.Value;
    }
}
