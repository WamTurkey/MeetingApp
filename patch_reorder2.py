import os

filepath = "/Users/boravarol01gmail.com/Desktop/Toplantı/backend/Controllers/MeetingsController.cs"
content = open(filepath).read()

# Add a Console.WriteLine at the top of ReorderItems
to_replace = """    [HttpPut("{id}/reorder-items")]
    public async Task<IActionResult> ReorderItems(int id, [FromBody] List<ReorderItemDto> items)
    {
        var noteUpdates = items.Where(x => x.Type == "NOTE").ToList();"""

replacement = """    [HttpPut("{id}/reorder-items")]
    public async Task<IActionResult> ReorderItems(int id, [FromBody] List<ReorderItemDto> items)
    {
        Console.WriteLine($"HIT REORDER: id={id}, items_count={items.Count}");
        var noteUpdates = items.Where(x => x.Type == "NOTE").ToList();"""

content = content.replace(to_replace, replacement)
open(filepath, 'w').write(content)
