using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Catalog;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public ProjectsController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetAll() =>
        Ok(await _db.Projects.OrderBy(x => x.Name)
            .Select(x => new ProjectDto(x.Id, x.Name, x.Code, x.IsActive)).ToListAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetById(int id)
    {
        var x = await _db.Projects.FindAsync(id);
        if (x == null) return NotFound();
        return Ok(new ProjectDto(x.Id, x.Name, x.Code, x.IsActive));
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectDto dto)
    {
        var e = new Project { Name = dto.Name, Code = dto.Code, CreatedBy = 1 };
        _db.Projects.Add(e); await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = e.Id }, new ProjectDto(e.Id, e.Name, e.Code, e.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectDto>> Update(int id, [FromBody] UpdateProjectDto dto)
    {
        var x = await _db.Projects.FindAsync(id);
        if (x == null) return NotFound();
        x.Name = dto.Name; x.Code = dto.Code; x.IsActive = dto.IsActive;
        x.UpdatedBy = 1; x.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new ProjectDto(x.Id, x.Name, x.Code, x.IsActive));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var x = await _db.Projects.FindAsync(id);
        if (x == null) return NotFound();
        x.IsDeleted = true; x.DeletedAt = DateTime.UtcNow; x.DeletedBy = 1;
        await _db.SaveChangesAsync(); return NoContent();
    }
}
