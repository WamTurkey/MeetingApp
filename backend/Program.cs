using System.Text;
using MeetingApp.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ──────────── Services ────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddScoped<MeetingApp.API.Services.OutlookCalendarService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ──────────── DbContext — SQL Server ──────────────────────────────
builder.Services.AddDbContext<MeetingDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        }));

// ──────────── JWT Authentication ─────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key must be configured in User Secrets or appsettings.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(1),
    };
});

builder.Services.AddAuthorization();

// ──────────── CORS — React frontend için ─────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ──────────── Middleware Pipeline ─────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();   // JWT auth middleware
app.UseAuthorization();
app.MapControllers();


// ──────────── Auto-migrate: Titles table + User.Role column ──────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MeetingDbContext>();
    try
    {
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Titles' AND schema_id = SCHEMA_ID('dbo'))
            CREATE TABLE [dbo].[Titles] (
                [Id] INT IDENTITY(1,1) PRIMARY KEY, [Name] NVARCHAR(100) NOT NULL,
                [IsActive] BIT NOT NULL DEFAULT 1, [IsDeleted] BIT NOT NULL DEFAULT 0,
                [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(), [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                [CreatedBy] INT NULL, [UpdatedBy] INT NULL, [DeletedAt] DATETIME2 NULL, [DeletedBy] INT NULL
            )");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'Role')
            ALTER TABLE [dbo].[Users] ADD [Role] NVARCHAR(30) NOT NULL DEFAULT 'User'");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MeetingParticipants') AND name = 'IsAttended')
            ALTER TABLE [dbo].[MeetingParticipants] ADD [IsAttended] BIT NOT NULL DEFAULT 1");
        
        // Force update all to 1 initially just to fix old data
        db.Database.ExecuteSqlRaw("UPDATE [dbo].[MeetingParticipants] SET [IsAttended] = 1 WHERE [IsAttended] = 0");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Notes') AND name = 'DisplayOrder')
            ALTER TABLE [dbo].[Notes] ADD [DisplayOrder] INT NOT NULL DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FollowupItems') AND name = 'DisplayOrder')
            ALTER TABLE [dbo].[FollowupItems] ADD [DisplayOrder] INT NOT NULL DEFAULT 0;
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Meetings') AND name = 'OutlookEventId')
            ALTER TABLE [dbo].[Meetings] ADD [OutlookEventId] NVARCHAR(MAX) NULL");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FollowupItems') AND name = 'RolledOverFromId')
            ALTER TABLE [dbo].[FollowupItems] ADD [RolledOverFromId] INT NULL;
            IF NOT EXISTS (SELECT 1 FROM [dbo].[LK_ActionStatus] WHERE [StatusCode] = 'ROLLED_OVER')
            INSERT INTO [dbo].[LK_ActionStatus] ([StatusCode], [DisplayName], [SortOrder]) VALUES ('ROLLED_OVER', N'Devredildi', 5);
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FollowupItemDependencies' AND schema_id = SCHEMA_ID('dbo'))
            BEGIN
                CREATE TABLE [dbo].[FollowupItemDependencies] (
                    [Id] INT IDENTITY(1,1) PRIMARY KEY,
                    [ItemId] INT NOT NULL,
                    [DependsOnItemId] INT NOT NULL,
                    [CreatedAt] DATETIME2(3) NOT NULL DEFAULT GETUTCDATE(),
                    CONSTRAINT FK_FID_Item FOREIGN KEY (ItemId) REFERENCES dbo.FollowupItems(Id),
                    CONSTRAINT FK_FID_DependsOnItem FOREIGN KEY (DependsOnItemId) REFERENCES dbo.FollowupItems(Id),
                    CONSTRAINT CK_FID_NoSelfDependency CHECK (ItemId <> DependsOnItemId),
                    CONSTRAINT UQ_FID_Dependency UNIQUE (ItemId, DependsOnItemId)
                );
            END
        ");
        db.Database.ExecuteSqlRaw(@"
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FollowupItems') AND name = 'BlockerItemId')
            BEGIN
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_FI_Blocker')
                    ALTER TABLE [dbo].[FollowupItems] DROP CONSTRAINT [FK_FI_Blocker];
                IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_FI_NoCyclicBlocker')
                    ALTER TABLE [dbo].[FollowupItems] DROP CONSTRAINT [CK_FI_NoCyclicBlocker];
                ALTER TABLE [dbo].[FollowupItems] DROP COLUMN [BlockerItemId];
            END
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Titles] WHERE [Name] = N'Genel Müdür')
            INSERT INTO [dbo].[Titles] ([Name]) VALUES
                (N'Genel Müdür'),(N'Genel Müdür Yardımcısı'),(N'Proje Müdürü'),(N'Proje Koordinatörü'),
                (N'Yazılım Mimarı'),(N'Kıdemli Yazılım Geliştirici'),(N'Yazılım Geliştirici'),
                (N'Backend Geliştirici'),(N'Frontend Geliştirici'),(N'IT Yöneticisi'),(N'Sistem Yöneticisi'),
                (N'Saha Mühendisi'),(N'Enerji Mühendisi'),(N'İnşaat Mühendisi'),
                (N'İş Geliştirme Uzmanı'),(N'Satış Müdürü'),(N'Kalite Sorumlusu'),(N'İK Uzmanı'),
                (N'Mali İşler Müdürü'),(N'Muhasebe Sorumlusu'),(N'Hukuk Müşaviri'),(N'Danışman'),(N'Stajyer'),(N'Diğer')");
                db.Database.ExecuteSqlRaw("UPDATE [dbo].[Users] SET [Role] = 'Admin' WHERE [Email] = 'admin@wam.com.tr' AND [Role] = 'User'");
        // Reset admin password to admin123
        var hash = BCrypt.Net.BCrypt.HashPassword("admin123");
        db.Database.ExecuteSqlRaw($"UPDATE [dbo].[Users] SET [HashedPassword] = '{hash}' WHERE [Email] = 'admin@wam.com.tr'");

        // ──── FirmType kolonu ────
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Companies' AND COLUMN_NAME = 'FirmType')
            ALTER TABLE [dbo].[Companies] ADD [FirmType] NVARCHAR(20) NOT NULL DEFAULT 'EXTERNAL'");
    }
    catch (Exception ex) { Console.WriteLine($"[Migration] {ex.Message}"); }
}


app.Run();
