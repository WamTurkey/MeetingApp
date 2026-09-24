import os

filepath = "/Users/boravarol01gmail.com/Desktop/Toplantı/backend/Controllers/MeetingsController.cs"
content = open(filepath).read()

# Replace the whole ReorderItems method
import re
new_method = """    [HttpPut("{id}/reorder-items")]
    public async Task<IActionResult> ReorderItems(int id, [FromBody] List<ReorderItemDto> items)
    {
        try 
        {
            Console.WriteLine($"HIT REORDER: id={id}, items_count={items.Count}");
            var noteUpdates = items.Where(x => x.Type == "NOTE").ToList();
            var followupUpdates = items.Where(x => x.Type == "FOLLOWUP").ToList();

            using var transaction = await _db.Database.BeginTransactionAsync();
            
            foreach (var note in noteUpdates)
            {
                await _db.Notes
                    .Where(n => n.Id == note.Id && n.MeetingId == id)
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.DisplayOrder, note.Order));
            }

            foreach (var followup in followupUpdates)
            {
                await _db.FollowupItems
                    .Where(f => f.Id == followup.Id && f.SourceMeetingId == id)
                    .ExecuteUpdateAsync(s => s.SetProperty(f => f.DisplayOrder, followup.Order));
            }

            await transaction.CommitAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine("THE REORDER EXCEPTION IS: " + ex.ToString());
            return StatusCode(500, new { message = "Sıralama güncellenirken bir hata oluştu." });
        }
    }"""

# Use regex to find and replace the method
content = re.sub(r'\[HttpPut\("\{id\}/reorder-items"\)\].*?catch \(Exception ex\)\s*\{.*?return StatusCode\(500, new \{ message = "Sıralama güncellenirken bir hata oluştu\." \}\);\s*\}', new_method, content, flags=re.DOTALL)

open(filepath, 'w').write(content)
