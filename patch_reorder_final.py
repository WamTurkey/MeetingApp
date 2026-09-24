import os

filepath = "/Users/boravarol01gmail.com/Desktop/Toplantı/backend/Controllers/MeetingsController.cs"
content = open(filepath).read()

to_replace = """        catch (Exception)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Sıralama güncellenirken bir hata oluştu." });
        }"""

replacement = """        catch (Exception ex)
        {
            Console.WriteLine("THE REORDER EXCEPTION IS: " + ex.ToString());
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Sıralama güncellenirken bir hata oluştu." });
        }"""

content = content.replace(to_replace, replacement)
open(filepath, 'w').write(content)
