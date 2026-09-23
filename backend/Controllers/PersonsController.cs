using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Catalog;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonsController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public PersonsController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<PersonDto>>> GetAll()
    {
        var items = await _db.Persons
            .Include(p => p.Company)
            .OrderBy(p => p.FullName)
            .Select(p => new PersonDto(p.Id, p.FullName, p.CompanyId,
                p.Company != null ? p.Company.Name : null,
                p.Title, p.Email, p.Phone, p.IsActive, p.LinkedUserId))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PersonDto>> GetById(int id)
    {
        var p = await _db.Persons.Include(x => x.Company).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        return Ok(new PersonDto(p.Id, p.FullName, p.CompanyId,
            p.Company?.Name, p.Title, p.Email, p.Phone, p.IsActive, p.LinkedUserId));
    }

    [HttpPost]
    public async Task<ActionResult<PersonDto>> Create([FromBody] CreatePersonDto dto)
    {
        var person = new Person
        {
            FullName = dto.FullName, CompanyId = dto.CompanyId, Title = dto.Title,
            Email = dto.Email, Phone = dto.Phone, LinkedUserId = dto.LinkedUserId, CreatedBy = 1
        };
        _db.Persons.Add(person);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = person.Id },
            new PersonDto(person.Id, person.FullName, person.CompanyId, null,
                person.Title, person.Email, person.Phone, person.IsActive, person.LinkedUserId));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PersonDto>> Update(int id, [FromBody] UpdatePersonDto dto)
    {
        var p = await _db.Persons.FindAsync(id);
        if (p == null) return NotFound();
        p.FullName = dto.FullName; p.CompanyId = dto.CompanyId; p.Title = dto.Title;
        p.Email = dto.Email; p.Phone = dto.Phone; p.IsActive = dto.IsActive;
        p.LinkedUserId = dto.LinkedUserId;
        p.UpdatedBy = 1; p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new PersonDto(p.Id, p.FullName, p.CompanyId, null,
            p.Title, p.Email, p.Phone, p.IsActive, p.LinkedUserId));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Persons.FindAsync(id);
        if (p == null) return NotFound();
        p.IsDeleted = true; p.DeletedAt = DateTime.UtcNow; p.DeletedBy = 1;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
