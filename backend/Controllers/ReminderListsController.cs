using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Business;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReminderListsController : BaseApiController
{
    private readonly MeetingDbContext _db;
    public ReminderListsController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ReminderListDto>>> GetAll()
    {
        var items = await _db.ReminderLists
            .OrderBy(l => l.Name)
            .Select(l => new ReminderListDto(
                l.Id, l.Name, l.Color, l.Icon,
                l.Items.Count(i => !i.IsDeleted)))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<ReminderListDto>> Create([FromBody] CreateReminderListDto dto)
    {
        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrEmpty(name))
            return BadRequest(new { message = "Liste adı boş olamaz." });

        var list = new ReminderList
        {
            Name = name,
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "#007AFF" : dto.Color.Trim(),
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "list" : dto.Icon.Trim(),
            CreatedBy = CurrentUserId,
        };
        _db.ReminderLists.Add(list);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = list.Id },
            new ReminderListDto(list.Id, list.Name, list.Color, list.Icon, 0));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReminderListDto>> Update(int id, [FromBody] UpdateReminderListDto dto)
    {
        var list = await _db.ReminderLists.FindAsync(id);
        if (list == null) return NotFound();
        var name = (dto.Name ?? "").Trim();
        if (string.IsNullOrEmpty(name))
            return BadRequest(new { message = "Liste adı boş olamaz." });

        list.Name = name;
        list.Color = string.IsNullOrWhiteSpace(dto.Color) ? list.Color : dto.Color.Trim();
        list.Icon = string.IsNullOrWhiteSpace(dto.Icon) ? list.Icon : dto.Icon.Trim();
        list.UpdatedBy = CurrentUserId;
        list.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var count = await _db.FollowupItems.CountAsync(f => f.ListId == id);
        return Ok(new ReminderListDto(list.Id, list.Name, list.Color, list.Icon, count));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var list = await _db.ReminderLists.FindAsync(id);
        if (list == null) return NotFound();

        var items = await _db.FollowupItems.Where(f => f.ListId == id).ToListAsync();
        foreach (var item in items)
            item.ListId = null;

        list.IsDeleted = true;
        list.DeletedAt = DateTime.UtcNow;
        list.DeletedBy = CurrentUserId;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
