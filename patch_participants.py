import os

filepath = "/Users/boravarol01gmail.com/Desktop/Toplantı/backend/Controllers/MeetingsController.cs"
content = open(filepath).read()

# 1. Add IsAttended = true in AddParticipant
to_replace_add = """        var participant = new MeetingParticipant
        {
            MeetingId = id,
            PersonId = dto.PersonId,
            Role = dto.Role,
            CreatedBy = 1
        };"""

replacement_add = """        var participant = new MeetingParticipant
        {
            MeetingId = id,
            PersonId = dto.PersonId,
            Role = dto.Role,
            IsAttended = true, // Default as requested
            CreatedBy = 1
        };"""

content = content.replace(to_replace_add, replacement_add)

# 2. Add PATCH endpoint
to_add_patch = """
    // ──────────── PATCH /api/meetings/{id}/participants/{participantId}/attendance ────────────
    [HttpPatch("{id}/participants/{participantId}/attendance")]
    public async Task<IActionResult> ToggleAttendance(int id, int participantId, [FromBody] bool isAttended)
    {
        var p = await _db.MeetingParticipants.FirstOrDefaultAsync(x => x.Id == participantId && x.MeetingId == id);
        if (p == null) return NotFound();
        
        p.IsAttended = isAttended;
        p.UpdatedBy = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1");
        p.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        return NoContent();
    }
"""

content = content.replace("    // ──────────── DELETE /api/meetings/{id}/participants/{participantId} ────────────", to_add_patch + "\n    // ──────────── DELETE /api/meetings/{id}/participants/{participantId} ────────────")

open(filepath, 'w').write(content)
