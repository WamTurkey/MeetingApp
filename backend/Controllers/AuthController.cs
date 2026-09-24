using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Identity;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly MeetingDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(MeetingDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>POST /api/Auth/login</summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);
        if (user == null)
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.HashedPassword))
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });

        var token = GenerateJwtToken(user);

        return Ok(new LoginResponseDto(user.Id, user.Email, user.FullName, token));
    }

    /// <summary>POST /api/Auth/register</summary>
    [HttpPost("register")]
    public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return Conflict(new { message = "Bu e-posta adresi zaten kayıtlı." });

        var user = new User
        {
            Email = dto.Email.Trim().ToLower(),
            HashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            IsActive = true,
            IsSuperuser = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return CreatedAtAction(nameof(Me), new LoginResponseDto(user.Id, user.Email, user.FullName, token));
    }

    /// <summary>GET /api/Auth/me — returns the current logged-in user</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive)
            return Unauthorized();

        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.IsActive, user.IsSuperuser));
    }

    // ──────────── JWT Token Generation ────────────

    private string GenerateJwtToken(User user)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim("isSuperuser", user.IsSuperuser.ToString().ToLower()),
        };

        var expireMinutes = int.TryParse(_config["Jwt:ExpireMinutes"], out var min) ? min : 480;

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
