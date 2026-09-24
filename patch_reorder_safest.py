import os
import re

filepath = "/Users/boravarol01gmail.com/Desktop/Toplantı/backend/Controllers/MeetingsController.cs"
content = open(filepath).read()

new_method = """    [HttpPut("{id}/reorder-items")]
    public async Task<IActionResult> ReorderItems(int id, [FromBody] List<ReorderItemDto> items)
    {
        try 
        {
            var noteUpdates = items.Where(x => x.Type == "NOTE").ToList();
            var followupUpdates = items.Where(x => x.Type == "FOLLOWUP").ToList();

            var notes = await _db.Notes.Where(n => n.MeetingId == id).ToListAsync();
            var followups = await _db.FollowupItems.Where(f => f.SourceMeetingId == id).ToListAsync();

            foreach (var update in noteUpdates)
            {
                var n = notes.FirstOrDefault(x => x.Id == update.Id);
                if (n != null) n.DisplayOrder = update.Order;
            }

            foreach (var update in followupUpdates)
            {
                var f = followups.FirstOrDefault(x => x.Id == update.Id);
                if (f != null) f.DisplayOrder = update.Order;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine("REORDER EXCEPTION: " + ex.ToString());
            return StatusCode(500, new { message = "Sıralama güncellenirken bir hata oluştu." });
        }
    }"""

content = re.sub(r'\[HttpPut\("\{id\}/reorder-items"\)\].*?catch \(Exception ex\)\s*\{.*?return StatusCode\(500, new \{ message = "Sıralama güncellenirken bir hata oluştu\." \}\);\s*\}', new_method, content, flags=re.DOTALL)

open(filepath, 'w').write(content)
