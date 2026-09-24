using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MeetingApp.API.Models;
using MeetingApp.API.Models.Lookups;
using MeetingApp.API.Models.Identity;
using MeetingApp.API.Models.Catalog;
using MeetingApp.API.Models.Business;

namespace MeetingApp.API.Data;

/// <summary>
/// Ana veritabanı bağlam sınıfı — SQL Server "Toplanti" veritabanı ile eşleşir.
/// 20 tablo: 6 Lookup + 2 Kimlik + 5 Tanım + 7 İş
/// </summary>
public class MeetingDbContext : DbContext
{
    public MeetingDbContext(DbContextOptions<MeetingDbContext> options)
        : base(options) { }

    // ──────────── Lookup Tabloları (6) ────────────
    public DbSet<LkMeetingStatus> LkMeetingStatuses => Set<LkMeetingStatus>();
    public DbSet<LkNoteType> LkNoteTypes => Set<LkNoteType>();
    public DbSet<LkActionStatus> LkActionStatuses => Set<LkActionStatus>();
    public DbSet<LkParticipantRole> LkParticipantRoles => Set<LkParticipantRole>();
    public DbSet<LkRelationType> LkRelationTypes => Set<LkRelationType>();
    public DbSet<LkChangeAction> LkChangeActions => Set<LkChangeAction>();

    // ──────────── Kimlik Tabloları (2) ────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();

    // ──────────── Tanım Tabloları (5) ─────────────
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Person> Persons => Set<Person>();
    public DbSet<Title> Titles => Set<Title>();

    // ──────────── İş Tabloları (7) ────────────────
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<MeetingLink> MeetingLinks => Set<MeetingLink>();
    public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<FollowupItem> FollowupItems => Set<FollowupItem>();
    public DbSet<FollowupChangeLog> FollowupChangeLogs => Set<FollowupChangeLog>();
    public DbSet<Attachment> Attachments => Set<Attachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("dbo");

        // ═══════ BÖLÜM 1: LOOKUP TABLOLARI ═══════

        modelBuilder.Entity<LkMeetingStatus>(e =>
        {
            e.ToTable("LK_MeetingStatus");
            e.HasKey(x => x.StatusCode);
            e.Property(x => x.StatusCode).HasMaxLength(20);
            e.Property(x => x.DisplayName).HasMaxLength(50);
        });

        modelBuilder.Entity<LkNoteType>(e =>
        {
            e.ToTable("LK_NoteType");
            e.HasKey(x => x.TypeCode);
            e.Property(x => x.TypeCode).HasMaxLength(20);
            e.Property(x => x.DisplayName).HasMaxLength(50);
        });

        modelBuilder.Entity<LkActionStatus>(e =>
        {
            e.ToTable("LK_ActionStatus");
            e.HasKey(x => x.StatusCode);
            e.Property(x => x.StatusCode).HasMaxLength(20);
            e.Property(x => x.DisplayName).HasMaxLength(50);
        });

        modelBuilder.Entity<LkParticipantRole>(e =>
        {
            e.ToTable("LK_ParticipantRole");
            e.HasKey(x => x.RoleCode);
            e.Property(x => x.RoleCode).HasMaxLength(20);
            e.Property(x => x.DisplayName).HasMaxLength(50);
        });

        modelBuilder.Entity<LkRelationType>(e =>
        {
            e.ToTable("LK_RelationType");
            e.HasKey(x => x.TypeCode);
            e.Property(x => x.TypeCode).HasMaxLength(20);
            e.Property(x => x.DisplayName).HasMaxLength(50);
        });

        modelBuilder.Entity<LkChangeAction>(e =>
        {
            e.ToTable("LK_ChangeAction");
            e.HasKey(x => x.ActionCode);
            e.Property(x => x.ActionCode).HasMaxLength(10);
            e.Property(x => x.DisplayName).HasMaxLength(50);
        });

        // ═══════ BÖLÜM 2: KİMLİK TABLOLARI ═══════

        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).HasMaxLength(320);
            e.Property(x => x.HashedPassword).HasMaxLength(500);
            e.Property(x => x.FullName).HasMaxLength(200).HasDefaultValue(string.Empty);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.Property(x => x.IsSuperuser).HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<UserPreference>(e =>
        {
            e.ToTable("UserPreferences");
            e.HasKey(x => x.Id);
            e.Property(x => x.PreferenceKey).HasMaxLength(100);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(x => new { x.UserId, x.PreferenceKey }).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.Preferences).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ═══════ BÖLÜM 3: TANIM (CATALOG) TABLOLARI ═══════

        modelBuilder.Entity<Company>(e =>
        {
            e.ToTable("Companies");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.ShortName).HasMaxLength(50);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.ToTable("Projects");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Code).HasMaxLength(20);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Location>(e =>
        {
            e.ToTable("Locations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("Categories");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });


        // ──── Titles (Unvanlar) ────
        modelBuilder.Entity<Title>(e =>
        {
            e.ToTable("Titles", "dbo");
            e.HasKey(t => t.Id);
            e.Property(t => t.Name).HasMaxLength(100).IsRequired();
            e.HasQueryFilter(t => !t.IsDeleted);
            e.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.Property(t => t.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Person>(e =>
        {
            e.ToTable("Persons");
            e.HasKey(x => x.Id);
            e.Property(x => x.FullName).HasMaxLength(150);
            e.Property(x => x.Title).HasMaxLength(100);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);
            e.HasOne(x => x.Company).WithMany(c => c.Persons).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.LinkedUser).WithMany().HasForeignKey(x => x.LinkedUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // ═══════ BÖLÜM 4: ANA İŞ TABLOLARI ═══════

        // ── 4.1 Meetings ──
        modelBuilder.Entity<Meeting>(e =>
        {
            e.ToTable("Meetings");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("DRAFT");
            e.Property(x => x.Version).HasDefaultValue(0);
            e.Property(x => x.NextMeetingNote).HasMaxLength(500);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);

            e.HasOne(x => x.StatusNavigation).WithMany(s => s.Meetings).HasForeignKey(x => x.Status).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Project).WithMany(p => p.Meetings).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Company).WithMany(c => c.Meetings).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Location).WithMany(l => l.Meetings).HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Category).WithMany(c => c.Meetings).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.MeetingDate);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedBy);
        });

        // ── 4.2 MeetingLinks ──
        modelBuilder.Entity<MeetingLink>(e =>
        {
            e.ToTable("MeetingLinks");
            e.HasKey(x => x.Id);
            e.Property(x => x.RelationType).HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(x => new { x.ParentMeetingId, x.ChildMeetingId }).IsUnique();

            e.HasOne(x => x.ParentMeeting).WithMany(m => m.ParentLinks).HasForeignKey(x => x.ParentMeetingId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ChildMeeting).WithMany(m => m.ChildLinks).HasForeignKey(x => x.ChildMeetingId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.RelationTypeNavigation).WithMany(r => r.MeetingLinks).HasForeignKey(x => x.RelationType).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // ── 4.3 MeetingParticipants ──
        modelBuilder.Entity<MeetingParticipant>(e =>
        {
            e.ToTable("MeetingParticipants");
            e.HasKey(x => x.Id);
            e.Property(x => x.Role).HasMaxLength(20).HasDefaultValue("ATTENDEE");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(x => new { x.MeetingId, x.PersonId }).IsUnique();

            e.HasOne(x => x.Meeting).WithMany(m => m.Participants).HasForeignKey(x => x.MeetingId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Person).WithMany(p => p.MeetingParticipants).HasForeignKey(x => x.PersonId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.RoleNavigation).WithMany(r => r.MeetingParticipants).HasForeignKey(x => x.Role).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // ── 4.4 Notes ──
        modelBuilder.Entity<Note>(e =>
        {
            e.ToTable("Notes");
            e.HasKey(x => x.Id);
            e.Property(x => x.NoteType).HasMaxLength(20).HasDefaultValue("NOTE");
            e.Property(x => x.DisplayOrder).HasDefaultValue(0);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);

            e.HasOne(x => x.Meeting).WithMany(m => m.Notes).HasForeignKey(x => x.MeetingId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.NoteTypeNavigation).WithMany(n => n.Notes).HasForeignKey(x => x.NoteType).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ResponsiblePerson).WithMany(p => p.ResponsibleNotes).HasForeignKey(x => x.ResponsiblePersonId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ActionStatusNavigation).WithMany(a => a.Notes).HasForeignKey(x => x.ActionStatus).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // ── 4.5 FollowupItems ──
        modelBuilder.Entity<FollowupItem>(e =>
        {
            e.ToTable("FollowupItems");
            e.HasKey(x => x.Id);
            e.Property(x => x.ActionStatus).HasMaxLength(20).HasDefaultValue("OPEN");
            e.Property(x => x.WaitingReason).HasMaxLength(500);
            e.Property(x => x.Version).HasDefaultValue(0);
            ConfigureAuditFields(e);
            e.HasQueryFilter(x => !x.IsDeleted);

            e.HasOne(x => x.ResponsiblePerson).WithMany(p => p.ResponsibleFollowups).HasForeignKey(x => x.ResponsiblePersonId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ResponsibleCompany).WithMany(c => c.FollowupItems).HasForeignKey(x => x.ResponsibleCompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ActionStatusNavigation).WithMany(a => a.FollowupItems).HasForeignKey(x => x.ActionStatus).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.BlockerItem).WithMany(f => f.BlockedItems).HasForeignKey(x => x.BlockerItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.SourceMeeting).WithMany(m => m.SourceFollowups).HasForeignKey(x => x.SourceMeetingId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.SourceNote).WithMany(n => n.SourceFollowups).HasForeignKey(x => x.SourceNoteId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.UpdatedByUser).WithMany().HasForeignKey(x => x.UpdatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // ── 4.6 FollowupChangeLogs (Immutable — NO soft delete) ──
        modelBuilder.Entity<FollowupChangeLog>(e =>
        {
            e.ToTable("FollowupChangeLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).HasMaxLength(10);
            e.Property(x => x.FieldName).HasMaxLength(50);
            e.Property(x => x.OldValue).HasMaxLength(500);
            e.Property(x => x.NewValue).HasMaxLength(500);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.ChangedAt).HasDefaultValueSql("SYSUTCDATETIME()");

            e.HasOne(x => x.Followup).WithMany(f => f.ChangeLogs).HasForeignKey(x => x.FollowupId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ActionNavigation).WithMany(a => a.FollowupChangeLogs).HasForeignKey(x => x.Action).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ChangedByUser).WithMany().HasForeignKey(x => x.ChangedBy).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.FollowupId);
            e.HasIndex(x => x.ChangedAt).IsDescending();
        });

        // ── 4.7 Attachments (Polimorfik) ──
        modelBuilder.Entity<Attachment>(e =>
        {
            e.ToTable("Attachments");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityType).HasMaxLength(30);
            e.Property(x => x.FileName).HasMaxLength(500);
            e.Property(x => x.FileExtension).HasMaxLength(10);
            e.Property(x => x.MimeType).HasMaxLength(100);
            e.Property(x => x.StoragePath).HasMaxLength(1000);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(x => x.IsDeleted).HasDefaultValue(false);
            e.HasQueryFilter(x => !x.IsDeleted);

            // Attachment uses UploadedBy as its main User FK
            e.HasOne(x => x.UploadedByUser).WithMany().HasForeignKey(x => x.UploadedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.DeletedByUser).WithMany().HasForeignKey(x => x.DeletedBy).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });
    }

    /// <summary>
    /// AuditableEntity ortak alanlarını yapılandırır.
    /// </summary>
    private static void ConfigureAuditFields<T>(EntityTypeBuilder<T> builder) where T : AuditableEntity
    {
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.IsDeleted).HasDefaultValue(false);
    }
}
