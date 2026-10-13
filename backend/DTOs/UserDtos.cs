namespace MeetingApp.API.DTOs;

public record UserDto(int Id, string Email, string FullName, bool IsActive, bool IsSuperuser, string Role,
    int? LinkedPersonId = null, string? LinkedPersonName = null);

public record UserPreferenceDto(int Id, string PreferenceKey, string PreferenceValue);

public record SetPreferenceDto(string PreferenceKey, string PreferenceValue);

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(int Id, string Email, string FullName, string Token, string Role);

public record RegisterRequestDto(string Email, string Password, string FullName);

public record UpdateUserRoleDto(string Role);

/// <summary>PUT /api/Users/{id} — Admin tam kullanıcı güncellemesi. Password boş ise değiştirilmez.</summary>
public record UpdateUserDto(
    string Email,
    string FullName,
    string Role,
    bool IsActive,
    int? LinkedPersonId,
    string? Password
);

public record CreateUserDto(
    string Email, 
    string FullName, 
    string Password, 
    string Role, 
    bool IsActive, 
    int? LinkedPersonId
);
