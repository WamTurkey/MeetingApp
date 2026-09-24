using System;
using Microsoft.Data.SqlClient;

class Program {
    static void Main() {
        string connStr = "Server=localhost,1433;Database=MeetingDb;User Id=sa;Password=YourStrong@Passw0rd!;TrustServerCertificate=True;";
        using (var conn = new SqlConnection(connStr)) {
            conn.Open();
            var cmd = new SqlCommand("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notes'", conn);
            using (var reader = cmd.ExecuteReader()) {
                while(reader.Read()) {
                    Console.WriteLine(reader.GetString(0));
                }
            }
        }
    }
}
