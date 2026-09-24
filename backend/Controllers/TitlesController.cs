using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.Models.Business;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TitlesController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public TitlesController(MeetingDbContext db) => _db = db;

    public record TitleDto(int Id, string Name, bool IsActive);
    public record CreateTitleRequest(string Name);
    public record UpdateTitleRequest(string Name, bool IsActive);

    [HttpGet]
    public async Task<ActionResult<List<TitleDto>>> GetAll()
    {
        var items = await _db.Titles
            .OrderBy(t => t.Name)
            .Select(t => new TitleDto(t.Id, t.Name, t.IsActive))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<TitleDto>> Create([FromBody] CreateTitleRequest dto)
    {
        var entity = new Title { Name = dto.Name.Trim(), CreatedBy = 1 };
        _db.Titles.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new TitleDto(entity.Id, entity.Name, entity.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TitleDto>> Update(int id, [FromBody] UpdateTitleRequest dto)
    {
        var entity = await _db.Titles.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Name = dto.Name.Trim();
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new TitleDto(entity.Id, entity.Name, entity.IsActive));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Titles.FindAsync(id);
        if (entity == null) return NotFound();
        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
