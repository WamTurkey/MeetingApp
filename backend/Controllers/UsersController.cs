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

    private static readonly string[] ValidRoles = { "Admin", "CatalogManager", "User" };

    private int? CurrentUserId =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    /// <summary>Kullanıcıyı, bağlı olduğu katalog kişisi bilgisiyle birlikte DTO'ya çevirir.</summary>
    private async Task<UserDto> ToDtoAsync(MeetingApp.API.Models.Identity.User u)
    {
        var person = await _db.Persons
            .Where(p => p.LinkedUserId == u.Id)
            .Select(p => new { p.Id, p.FullName })
            .FirstOrDefaultAsync();
        return new UserDto(u.Id, u.Email, u.FullName, u.IsActive, u.IsSuperuser, u.Role, person?.Id, person?.FullName);
    }

    /// <summary>Sistemde en az bir aktif Admin kalmasını garanti eder.</summary>
    private async Task<bool> IsLastActiveAdminAsync(int userId) =>
        !await _db.Users.AnyAsync(x => x.Id != userId && x.Role == "Admin" && x.IsActive);

    /// <summary>
    /// Kullanıcıyı katalog kişisine bağlar (veya personId null ise bağlantıyı kaldırır).
    /// Hata varsa mesaj, yoksa null döner. SaveChanges çağırmaz.
    /// </summary>
    private async Task<string?> ApplyPersonLinkAsync(int userId, int? personId)
    {
        // Eski bağlantıları kopar
        var oldLinks = await _db.Persons
            .Where(p => p.LinkedUserId == userId && (!personId.HasValue || p.Id != personId.Value))
            .ToListAsync();
        foreach (var p in oldLinks) p.LinkedUserId = null;

        if (!personId.HasValue) return null;
        var person = await _db.Persons.FindAsync(personId.Value);
        if (person == null) return "Seçilen kişi katalogda bulunamadı.";
        if (person.LinkedUserId != null && person.LinkedUserId != userId)
            return "Seçilen kişi zaten başka bir kullanıcıya bağlı.";
        person.LinkedUserId = userId;
        return null;
    }

    /// <summary>GET /api/Users — tüm kullanıcıları (bağlı kişi bilgisiyle) listele</summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var links = await _db.Persons
            .Where(p => p.LinkedUserId != null)
            .Select(p => new { p.Id, p.FullName, UserId = p.LinkedUserId!.Value })
            .ToListAsync();
        var linkMap = links.GroupBy(l => l.UserId).ToDictionary(g => g.Key, g => g.First());

        var users = await _db.Users.OrderBy(u => u.FullName).ToListAsync();
        return Ok(users.Select(u =>
        {
            linkMap.TryGetValue(u.Id, out var link);
            return new UserDto(u.Id, u.Email, u.FullName, u.IsActive, u.IsSuperuser, u.Role, link?.Id, link?.FullName);
        }).ToList());
    }

    /// <summary>GET /api/Users/{id}</summary>
    [HttpGet("{id}", Name = "GetUserById")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        return Ok(await ToDtoAsync(u));
    }

    /// <summary>POST /api/Users — Sadece Admin kullanıcı oluşturabilir</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Ad Soyad ve E-posta zorunludur." });
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest(new { message = "Şifre en az 6 karakter olmalıdır." });

        var email = dto.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Bu e-posta adresi zaten kullanımda." });

        var role = ValidRoles.Contains(dto.Role) ? dto.Role : "User";

        // Kişi bağlantısını kullanıcı oluşturmadan ÖNCE doğrula (yarım kayıt kalmasın)
        if (dto.LinkedPersonId.HasValue)
        {
            var person = await _db.Persons.FindAsync(dto.LinkedPersonId.Value);
            if (person == null) return BadRequest(new { message = "Seçilen kişi katalogda bulunamadı." });
            if (person.LinkedUserId != null)
                return BadRequest(new { message = "Seçilen kişi zaten başka bir kullanıcıya bağlı." });
        }

        // Not: EnableRetryOnFailure aktif olduğu için kullanıcı tanımlı transaction yerine telafi (compensation) kullanılır.
        var user = new MeetingApp.API.Models.Identity.User
        {
            Email = email,
            FullName = dto.FullName.Trim(),
            HashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            IsActive = dto.IsActive,
            IsSuperuser = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(); // get user.Id

        var linkError = await ApplyPersonLinkAsync(user.Id, dto.LinkedPersonId);
        if (linkError != null)
        {
            _db.Users.Remove(user); // yarım kayıt bırakma
            await _db.SaveChangesAsync();
            return BadRequest(new { message = linkError });
        }
        await _db.SaveChangesAsync();

        return CreatedAtRoute("GetUserById", new { id = user.Id }, await ToDtoAsync(user));
    }

    /// <summary>PUT /api/Users/{id} — Sadece Admin: ad, e-posta, rol, aktiflik, bağlı kişi ve (opsiyonel) şifre günceller</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Ad Soyad ve E-posta zorunludur." });
        if (!ValidRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Geçersiz rol. Kabul edilen roller: {string.Join(", ", ValidRoles)}" });

        var email = dto.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(u => u.Email == email && u.Id != id))
            return Conflict(new { message = "Bu e-posta adresi zaten kullanımda." });

        var isSelf = CurrentUserId == id;
        if (isSelf && (dto.Role != user.Role || !dto.IsActive))
            return BadRequest(new { message = "Kendi rolünüzü veya aktiflik durumunuzu değiştiremezsiniz." });

        if (user.Role == "Admin" && (dto.Role != "Admin" || !dto.IsActive) && await IsLastActiveAdminAsync(id))
            return BadRequest(new { message = "Sistemde en az bir aktif Sistem Yöneticisi bulunmalıdır." });

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            if (dto.Password.Length < 6)
                return BadRequest(new { message = "Şifre en az 6 karakter olmalıdır." });
            user.HashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        var linkError = await ApplyPersonLinkAsync(id, dto.LinkedPersonId);
        if (linkError != null) return BadRequest(new { message = linkError });

        user.Email = email;
        user.FullName = dto.FullName.Trim();
        user.Role = dto.Role;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(await ToDtoAsync(user));
    }

    /// <summary>
    /// DELETE /api/Users/{id} — Sadece Admin. Kullanıcı fiziksel olarak silinmez (denetim izleri korunur);
    /// pasife alınır ve katalog kişisi bağlantısı kaldırılır.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (CurrentUserId == id)
            return BadRequest(new { message = "Kendi hesabınızı silemezsiniz." });
        if (user.Role == "Admin" && await IsLastActiveAdminAsync(id))
            return BadRequest(new { message = "Sistemde en az bir aktif Sistem Yöneticisi bulunmalıdır." });

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await ApplyPersonLinkAsync(id, null);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>PUT /api/Users/{id}/role — Sadece Admin rolü atayabilir</summary>
    [HttpPut("{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> UpdateRole(int id, [FromBody] UpdateUserRoleDto dto)
    {
        if (!ValidRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Geçersiz rol. Kabul edilen roller: {string.Join(", ", ValidRoles)}" });

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (CurrentUserId == id)
            return BadRequest(new { message = "Kendi rolünüzü değiştiremezsiniz." });
        if (user.Role == "Admin" && dto.Role != "Admin" && await IsLastActiveAdminAsync(id))
            return BadRequest(new { message = "Sistemde en az bir aktif Sistem Yöneticisi bulunmalıdır." });

        user.Role = dto.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(await ToDtoAsync(user));
    }

    /// <summary>PUT /api/Users/{id}/active — Sadece Admin aktiflik değiştirebilir</summary>
    [HttpPut("{id}/active")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> ToggleActive(int id, [FromBody] bool isActive)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        if (CurrentUserId == id && !isActive)
            return BadRequest(new { message = "Kendi hesabınızı pasife alamazsınız." });
        if (!isActive && user.Role == "Admin" && await IsLastActiveAdminAsync(id))
            return BadRequest(new { message = "Sistemde en az bir aktif Sistem Yöneticisi bulunmalıdır." });
        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(await ToDtoAsync(user));
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
