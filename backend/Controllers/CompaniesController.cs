using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MeetingApp.API.Data;
using MeetingApp.API.DTOs;
using MeetingApp.API.Models.Catalog;

namespace MeetingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly MeetingDbContext _db;
    public CompaniesController(MeetingDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CompanyDto>>> GetAll()
    {
        var items = await _db.Companies
            .OrderBy(c => c.Name)
            .Select(c => new CompanyDto(c.Id, c.Name, c.ShortName, c.IsActive))
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDto>> GetById(int id)
    {
        var c = await _db.Companies.FindAsync(id);
        if (c == null) return NotFound();
        return Ok(new CompanyDto(c.Id, c.Name, c.ShortName, c.IsActive));
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> Create([FromBody] CreateCompanyDto dto)
    {
        var company = new Company { Name = dto.Name, ShortName = dto.ShortName, CreatedBy = 1 };
        _db.Companies.Add(company);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = company.Id },
            new CompanyDto(company.Id, company.Name, company.ShortName, company.IsActive));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CompanyDto>> Update(int id, [FromBody] UpdateCompanyDto dto)
    {
        var c = await _db.Companies.FindAsync(id);
        if (c == null) return NotFound();
        c.Name = dto.Name;
        c.ShortName = dto.ShortName;
        c.IsActive = dto.IsActive;
        c.UpdatedBy = 1;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new CompanyDto(c.Id, c.Name, c.ShortName, c.IsActive));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Companies.FindAsync(id);
        if (c == null) return NotFound();
        c.IsDeleted = true; c.DeletedAt = DateTime.UtcNow; c.DeletedBy = 1;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
