using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Catalog;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public LocationsController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<LocationDto>>> GetAll() =>
        Ok(await _db.Locations.OrderBy(x => x.Name)
            .Select(x => new LocationDto(x.Id, x.Name, x.IsActive)).ToListAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<LocationDto>> GetById(int id)
    {
        var x = await _db.Locations.FindAsync(id);
        if (x == null) return NotFound();
        return Ok(new LocationDto(x.Id, x.Name, x.IsActive));
    }

    [HttpPost]
    public async Task<ActionResult<LocationDto>> Create([FromBody] CreateLocationDto dto)
    {
        var e = new Location { Name = dto.Name, CreatedBy = 1 };
        _db.Locations.Add(e); await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = e.Id }, new LocationDto(e.Id, e.Name, e.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LocationDto>> Update(int id, [FromBody] UpdateLocationDto dto)
    {
        var x = await _db.Locations.FindAsync(id);
        if (x == null) return NotFound();
        x.Name = dto.Name; x.IsActive = dto.IsActive;
        x.UpdatedBy = 1; x.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new LocationDto(x.Id, x.Name, x.IsActive));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var x = await _db.Locations.FindAsync(id);
        if (x == null) return NotFound();
        x.IsDeleted = true; x.DeletedAt = DateTime.UtcNow; x.DeletedBy = 1;
        await _db.SaveChangesAsync(); return NoContent();
    }
}
