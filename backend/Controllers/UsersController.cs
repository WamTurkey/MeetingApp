using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public UsersController(MeetingDbContext db) => _db = db;

    /// <summary>GET /api/Users — tüm kullanıcıları listele</summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _db.Users
            .OrderBy(u => u.FullName)
            .Select(u => new UserDto(u.Id, u.Email, u.FullName, u.IsActive, u.IsSuperuser, u.Role))
            .ToListAsync();
        return Ok(users);
    }

    /// <summary>GET /api/Users/{id}</summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        return Ok(new UserDto(u.Id, u.Email, u.FullName, u.IsActive, u.IsSuperuser, u.Role));
    }

    /// <summary>PUT /api/Users/{id}/role — Sadece Admin rolü atayabilir</summary>
    [HttpPut("{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> UpdateRole(int id, [FromBody] UpdateUserRoleDto dto)
    {
        var validRoles = new[] { "Admin", "CatalogManager", "User" };
        if (!validRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Geçersiz rol. Kabul edilen roller: {string.Join(", ", validRoles)}" });

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = dto.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.IsActive, user.IsSuperuser, user.Role));
    }

    /// <summary>PUT /api/Users/{id}/active — Sadece Admin aktiflik değiştirebilir</summary>
    [HttpPut("{id}/active")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> ToggleActive(int id, [FromBody] bool isActive)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.IsActive, user.IsSuperuser, user.Role));
    }

    // ──────── Preferences (existing) ────────

    [HttpGet("{id}/preferences")]
    [Authorize]
    public async Task<ActionResult<List<UserPreferenceDto>>> GetPreferences(int id)
    {
        var prefs = await _db.UserPreferences
            .Where(p => p.UserId == id)
            .Select(p => new UserPreferenceDto(p.Id, p.PreferenceKey, p.PreferenceValue))
            .ToListAsync();
        return Ok(prefs);
    }

    [HttpPost("{id}/preferences")]
    [Authorize]
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
            existing = new MeetingApp.API.Models.Identity.UserPreference
            {
                UserId = id, PreferenceKey = dto.PreferenceKey, PreferenceValue = dto.PreferenceValue
            };
            _db.UserPreferences.Add(existing);
        }
        await _db.SaveChangesAsync();
        return Ok(new UserPreferenceDto(existing.Id, existing.PreferenceKey, existing.PreferenceValue));
    }
}
