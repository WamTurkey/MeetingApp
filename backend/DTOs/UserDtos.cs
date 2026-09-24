namespace MeetingApp.API.DTOs;

public record UserDto(int Id, string Email, string FullName, bool IsActive, bool IsSuperuser);

public record UserPreferenceDto(int Id, string PreferenceKey, string PreferenceValue);

public record SetPreferenceDto(string PreferenceKey, string PreferenceValue);

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(int Id, string Email, string FullName, string Token);

public record RegisterRequestDto(string Email, string Password, string FullName);
