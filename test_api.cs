using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        var content = new StringContent("{\"email\":\"test99@test.com\",\"fullName\":\"Test 99\",\"password\":\"password123\",\"role\":\"User\",\"isActive\":true,\"linkedPersonId\":null}", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("http://localhost:5180/api/Users", content);
        Console.WriteLine($"Status: {response.StatusCode}");
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}
