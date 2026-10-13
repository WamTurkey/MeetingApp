file_path = "/Users/boravarol01gmail.com/Desktop/Toplantı/backend/Controllers/MeetingsController.cs"
with open(file_path, "r") as f:
    content = f.read()

# Add to AddNote
add_note_target = """        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        var n = await _db.Notes"""

add_note_replacement = """        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        // ────────────────────────────
        // TAKİP/TERMİN ENTEGRASYONU
        // ────────────────────────────
        if (note.DueDate.HasValue || note.ResponsiblePersonId.HasValue || note.NoteType == "TASK")
        {
            var followup = new FollowupItem
            {
                Text = note.Content,
                ResponsiblePersonId = note.ResponsiblePersonId,
                DueDate = note.DueDate,
                SourceMeetingId = note.MeetingId,
                SourceNoteId = note.Id,
                ActionStatus = note.ActionStatus ?? "OPEN",
                CreatedBy = note.CreatedBy ?? 1
            };
            _db.FollowupItems.Add(followup);
            await _db.SaveChangesAsync();
        }

        var n = await _db.Notes"""
content = content.replace(add_note_target, add_note_replacement)

# Update to UpdateNote
update_note_target = """        note.ActionStatus = dto.ActionStatus;
        note.UpdatedBy = 1;
        note.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var n = await _db.Notes"""

update_note_replacement = """        note.ActionStatus = dto.ActionStatus;
        note.UpdatedBy = 1;
        note.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // ────────────────────────────
        // TAKİP/TERMİN ENTEGRASYONU GÜNCELLEMESİ
        // ────────────────────────────
        var existingFollowup = await _db.FollowupItems.FirstOrDefaultAsync(f => f.SourceNoteId == note.Id);
        bool shouldHaveFollowup = note.DueDate.HasValue || note.ResponsiblePersonId.HasValue || note.NoteType == "TASK";

        if (shouldHaveFollowup)
        {
            if (existingFollowup == null)
            {
                // Followup yok, yarat
                var followup = new FollowupItem
                {
                    Text = note.Content,
                    ResponsiblePersonId = note.ResponsiblePersonId,
                    DueDate = note.DueDate,
                    SourceMeetingId = note.MeetingId,
                    SourceNoteId = note.Id,
                    ActionStatus = note.ActionStatus ?? "OPEN",
                    CreatedBy = 1
                };
                _db.FollowupItems.Add(followup);
            }
            else
            {
                // Followup var, güncelle
                existingFollowup.Text = note.Content;
                existingFollowup.ResponsiblePersonId = note.ResponsiblePersonId;
                existingFollowup.DueDate = note.DueDate;
                existingFollowup.ActionStatus = note.ActionStatus ?? existingFollowup.ActionStatus;
                existingFollowup.UpdatedBy = 1;
                existingFollowup.UpdatedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
        }
        else if (existingFollowup != null)
        {
            // Followup var ama artık termin vs yok, kapat (veya sil)
            existingFollowup.ActionStatus = "CLOSED";
            existingFollowup.UpdatedBy = 1;
            existingFollowup.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        var n = await _db.Notes"""
content = content.replace(update_note_target, update_note_replacement)

# Also need to make sure Models.Business is imported if not already. FollowupItem is inside Models.Business
if "using MeetingApp.API.Models.Business;" not in content:
    # Just to be safe, add it at the top
    content = "using MeetingApp.API.Models.Business;\n" + content

with open(file_path, "w") as f:
    f.write(content)
print("Updated MeetingsController.cs for Followup integration")
