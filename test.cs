using System;
using Microsoft.AspNetCore.Mvc;

public class Program {
    public static void Main() {
        ActionResult<string> res = new OkObjectResult("test");
        Console.WriteLine($"Result: {res.Result != null}, Value: {res.Value == null}");
    }
}
