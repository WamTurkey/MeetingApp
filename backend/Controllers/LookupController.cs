using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookupController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public LookupController(MeetingDbContext db) => _db = db;

    /// <summary>Tüm lookup tablolarını tek seferde döner.</summary>
    [HttpGet]
    public async Task<ActionResult<AllLookupsDto>> GetAll()
    {
        var result = new AllLookupsDto(
            MeetingStatuses: await _db.LkMeetingStatuses
                .OrderBy(x => x.SortOrder)
                .Select(x => new LookupItemDto(x.StatusCode, x.DisplayName, x.SortOrder))
                .ToListAsync(),
            NoteTypes: await _db.LkNoteTypes
                .OrderBy(x => x.SortOrder)
                .Select(x => new LookupItemDto(x.TypeCode, x.DisplayName, x.SortOrder))
                .ToListAsync(),
            ActionStatuses: await _db.LkActionStatuses
                .OrderBy(x => x.SortOrder)
                .Select(x => new LookupItemDto(x.StatusCode, x.DisplayName, x.SortOrder))
                .ToListAsync(),
            ParticipantRoles: await _db.LkParticipantRoles
                .OrderBy(x => x.SortOrder)
                .Select(x => new LookupItemDto(x.RoleCode, x.DisplayName, x.SortOrder))
                .ToListAsync(),
            RelationTypes: await _db.LkRelationTypes
                .Select(x => new LookupItemDto(x.TypeCode, x.DisplayName, 0))
                .ToListAsync(),
            ChangeActions: await _db.LkChangeActions
                .Select(x => new LookupItemDto(x.ActionCode, x.DisplayName, 0))
                .ToListAsync()
        );
        return Ok(result);
    }
}
