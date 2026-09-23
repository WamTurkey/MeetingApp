using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public UsersController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var items = await _db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new UserDto(u.Id, u.Email, u.FullName, u.IsActive, u.IsSuperuser))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        return Ok(new UserDto(u.Id, u.Email, u.FullName, u.IsActive, u.IsSuperuser));
    }

    [HttpGet("{id}/preferences")]
    public async Task<ActionResult<List<UserPreferenceDto>>> GetPreferences(int id)
    {
        var prefs = await _db.UserPreferences
            .Where(p => p.UserId == id)
            .Select(p => new UserPreferenceDto(p.Id, p.PreferenceKey, p.PreferenceValue))
            .ToListAsync();
        return Ok(prefs);
    }

    [HttpPost("{id}/preferences")]
    public async Task<ActionResult<UserPreferenceDto>> SetPreference(int id, [FromBody] SetPreferenceDto dto)
    {
        var existing = await _db.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == id && p.PreferenceKey == dto.PreferenceKey);

        if (existing != null)
        {
            existing.PreferenceValue = dto.PreferenceValue;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new UserPreference
            {
                UserId = id, PreferenceKey = dto.PreferenceKey, PreferenceValue = dto.PreferenceValue
            };
            _db.UserPreferences.Add(existing);
        }
        await _db.SaveChangesAsync();
        return Ok(new UserPreferenceDto(existing.Id, existing.PreferenceKey, existing.PreferenceValue));
    }
}
