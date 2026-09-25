namespace MeetingApp.API.DTOs;

// ──────────── Company ────────────
public record CompanyDto(int Id, string Name, string? ShortName, bool IsActive, string FirmType);
public record CreateCompanyDto(string Name, string? ShortName, string FirmType = "EXTERNAL");
public record UpdateCompanyDto(string Name, string? ShortName, bool IsActive, string FirmType);

// ──────────── Project ────────────
public record ProjectDto(int Id, string Name, string? Code, bool IsActive);
public record CreateProjectDto(string Name, string? Code);
public record UpdateProjectDto(string Name, string? Code, bool IsActive);

// ──────────── Location ────────────
public record LocationDto(int Id, string Name, bool IsActive);
public record CreateLocationDto(string Name);
public record UpdateLocationDto(string Name, bool IsActive);

// ──────────── Category ────────────
public record CategoryDto(int Id, string Name, bool IsActive);
public record CreateCategoryDto(string Name);
public record UpdateCategoryDto(string Name, bool IsActive);

// ──────────── Person ────────────
public record PersonDto(
    int Id, string FullName, int? CompanyId, string? CompanyName,
    string? Title, string? Email, string? Phone, bool IsActive, int? LinkedUserId);
public record CreatePersonDto(
    string FullName, int? CompanyId, string? Title, string? Email, string? Phone, int? LinkedUserId);
public record UpdatePersonDto(
    string FullName, int? CompanyId, string? Title, string? Email, string? Phone, bool IsActive, int? LinkedUserId);
