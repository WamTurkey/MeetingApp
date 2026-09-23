-- ══════════════════════════════════════════════════════════════════════
-- TOPLANTI YÖNETİMİ — SQL Server Veritabanı Şeması (Production DDL)
-- ══════════════════════════════════════════════════════════════════════
-- Sürüm  : 1.0.0
-- Tarih  : 2026-09-23
-- Motor  : SQL Server 2019+ / Azure SQL Database
-- Toplam : 20 tablo (6 Lookup + 2 Kimlik + 5 Tanım + 7 İş) + 2 VIEW
-- ══════════════════════════════════════════════════════════════════════

USE [ToplantiYonetimi];
GO

-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BÖLÜM 1: LOOKUP / ENUM TABLOLARI (6 adet)                    │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE dbo.LK_MeetingStatus (
    StatusCode   NVARCHAR(20)  NOT NULL,
    DisplayName  NVARCHAR(50)  NOT NULL,
    SortOrder    INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_LK_MeetingStatus PRIMARY KEY (StatusCode)
);
INSERT INTO dbo.LK_MeetingStatus (StatusCode, DisplayName, SortOrder) VALUES
    ('DRAFT',     N'Taslak',            1),
    ('ACTIVE',    N'Aktif',             2),
    ('COMPLETED', N'Tamamlandı',        3),
    ('EXPORTED',  N'Dışa Aktarıldı',   4);
GO

CREATE TABLE dbo.LK_NoteType (
    TypeCode     NVARCHAR(20)  NOT NULL,
    DisplayName  NVARCHAR(50)  NOT NULL,
    SortOrder    INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_LK_NoteType PRIMARY KEY (TypeCode)
);
INSERT INTO dbo.LK_NoteType (TypeCode, DisplayName, SortOrder) VALUES
    ('NOTE',     N'Not',    1),
    ('DECISION', N'Karar',  2),
    ('TASK',     N'Görev',  3),
    ('INFO',     N'Bilgi',  4);
GO

CREATE TABLE dbo.LK_ActionStatus (
    StatusCode   NVARCHAR(20)  NOT NULL,
    DisplayName  NVARCHAR(50)  NOT NULL,
    SortOrder    INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_LK_ActionStatus PRIMARY KEY (StatusCode)
);
INSERT INTO dbo.LK_ActionStatus (StatusCode, DisplayName, SortOrder) VALUES
    ('OPEN',        N'Açık',        1),
    ('IN_PROGRESS', N'Sürüyor',     2),
    ('DONE',        N'Tamamlandı',  3),
    ('CANCELLED',   N'İptal',       4);
GO

CREATE TABLE dbo.LK_ParticipantRole (
    RoleCode     NVARCHAR(20)  NOT NULL,
    DisplayName  NVARCHAR(50)  NOT NULL,
    SortOrder    INT           NOT NULL DEFAULT 0,
    CONSTRAINT PK_LK_ParticipantRole PRIMARY KEY (RoleCode)
);
INSERT INTO dbo.LK_ParticipantRole (RoleCode, DisplayName, SortOrder) VALUES
    ('ORGANIZER', N'Organizatör',   1),
    ('PRESENTER', N'Sunum Yapan',   2),
    ('ATTENDEE',  N'Katılımcı',     3),
    ('OBSERVER',  N'Gözlemci',      4);
GO

CREATE TABLE dbo.LK_RelationType (
    TypeCode     NVARCHAR(20)  NOT NULL,
    DisplayName  NVARCHAR(50)  NOT NULL,
    CONSTRAINT PK_LK_RelationType PRIMARY KEY (TypeCode)
);
INSERT INTO dbo.LK_RelationType (TypeCode, DisplayName) VALUES
    ('CONTINUATION', N'Devam Toplantısı'),
    ('FOLLOW_UP',    N'Takip Toplantısı');
GO

CREATE TABLE dbo.LK_ChangeAction (
    ActionCode   NVARCHAR(10)  NOT NULL,
    DisplayName  NVARCHAR(50)  NOT NULL,
    CONSTRAINT PK_LK_ChangeAction PRIMARY KEY (ActionCode)
);
INSERT INTO dbo.LK_ChangeAction (ActionCode, DisplayName) VALUES
    ('CREATE', N'Oluşturma'),
    ('UPDATE', N'Güncelleme'),
    ('DELETE', N'Silme');
GO


-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BÖLÜM 2: KİMLİK & YETKİ TABLOLARI (2 adet)                  │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE dbo.Users (
    Id              INT           IDENTITY(1,1) NOT NULL,
    Email           NVARCHAR(320) NOT NULL,
    HashedPassword  NVARCHAR(500) NOT NULL,
    FullName        NVARCHAR(200) NOT NULL DEFAULT N'',
    IsActive        BIT           NOT NULL DEFAULT 1,
    IsSuperuser     BIT           NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users PRIMARY KEY (Id),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
CREATE INDEX IX_Users_Email ON dbo.Users(Email);
GO

CREATE TABLE dbo.UserPreferences (
    Id              INT            IDENTITY(1,1) NOT NULL,
    UserId          INT            NOT NULL,
    PreferenceKey   NVARCHAR(100)  NOT NULL,
    PreferenceValue NVARCHAR(MAX)  NOT NULL,
    CreatedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserPreferences PRIMARY KEY (Id),
    CONSTRAINT FK_UserPref_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_UserPreference UNIQUE (UserId, PreferenceKey)
);
CREATE INDEX IX_UserPref_UserId ON dbo.UserPreferences(UserId);
GO


-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BÖLÜM 3: TANIM (CATALOG) TABLOLARI (5 adet)                  │
-- └─────────────────────────────────────────────────────────────────┘

CREATE TABLE dbo.Companies (
    Id          INT            IDENTITY(1,1) NOT NULL,
    Name        NVARCHAR(200)  NOT NULL,
    ShortName   NVARCHAR(50)   NULL,
    IsActive    BIT            NOT NULL DEFAULT 1,
    CreatedBy   INT            NOT NULL,
    UpdatedBy   INT            NULL,
    CreatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted   BIT            NOT NULL DEFAULT 0,
    DeletedAt   DATETIME2(3)   NULL,
    DeletedBy   INT            NULL,
    CONSTRAINT PK_Companies PRIMARY KEY (Id),
    CONSTRAINT FK_Companies_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Companies_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Companies_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id)
);
GO

CREATE TABLE dbo.Projects (
    Id          INT            IDENTITY(1,1) NOT NULL,
    Name        NVARCHAR(200)  NOT NULL,
    Code        NVARCHAR(20)   NULL,
    IsActive    BIT            NOT NULL DEFAULT 1,
    CreatedBy   INT            NOT NULL,
    UpdatedBy   INT            NULL,
    CreatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted   BIT            NOT NULL DEFAULT 0,
    DeletedAt   DATETIME2(3)   NULL,
    DeletedBy   INT            NULL,
    CONSTRAINT PK_Projects PRIMARY KEY (Id),
    CONSTRAINT FK_Projects_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Projects_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Projects_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id)
);
GO

CREATE TABLE dbo.Locations (
    Id          INT            IDENTITY(1,1) NOT NULL,
    Name        NVARCHAR(200)  NOT NULL,
    IsActive    BIT            NOT NULL DEFAULT 1,
    CreatedBy   INT            NOT NULL,
    UpdatedBy   INT            NULL,
    CreatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted   BIT            NOT NULL DEFAULT 0,
    DeletedAt   DATETIME2(3)   NULL,
    DeletedBy   INT            NULL,
    CONSTRAINT PK_Locations PRIMARY KEY (Id),
    CONSTRAINT FK_Locations_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Locations_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Locations_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id)
);
GO

CREATE TABLE dbo.Categories (
    Id          INT            IDENTITY(1,1) NOT NULL,
    Name        NVARCHAR(100)  NOT NULL,
    IsActive    BIT            NOT NULL DEFAULT 1,
    CreatedBy   INT            NOT NULL,
    UpdatedBy   INT            NULL,
    CreatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted   BIT            NOT NULL DEFAULT 0,
    DeletedAt   DATETIME2(3)   NULL,
    DeletedBy   INT            NULL,
    CONSTRAINT PK_Categories PRIMARY KEY (Id),
    CONSTRAINT FK_Categories_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Categories_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Categories_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id)
);
GO

CREATE TABLE dbo.Persons (
    Id            INT            IDENTITY(1,1) NOT NULL,
    FullName      NVARCHAR(150)  NOT NULL,
    CompanyId     INT            NULL,
    Title         NVARCHAR(100)  NULL,
    Email         NVARCHAR(200)  NULL,
    Phone         NVARCHAR(30)   NULL,
    IsActive      BIT            NOT NULL DEFAULT 1,
    LinkedUserId  INT            NULL,
    CreatedBy     INT            NOT NULL,
    UpdatedBy     INT            NULL,
    CreatedAt     DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt     DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted     BIT            NOT NULL DEFAULT 0,
    DeletedAt     DATETIME2(3)   NULL,
    DeletedBy     INT            NULL,
    CONSTRAINT PK_Persons PRIMARY KEY (Id),
    CONSTRAINT FK_Persons_Company FOREIGN KEY (CompanyId) REFERENCES dbo.Companies(Id),
    CONSTRAINT FK_Persons_LinkedUser FOREIGN KEY (LinkedUserId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Persons_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Persons_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Persons_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id)
);
CREATE INDEX IX_Persons_CompanyId ON dbo.Persons(CompanyId) WHERE CompanyId IS NOT NULL;
CREATE INDEX IX_Persons_LinkedUserId ON dbo.Persons(LinkedUserId) WHERE LinkedUserId IS NOT NULL;
GO


-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BÖLÜM 4: ANA İŞ TABLOLARI (7 adet)                           │
-- └─────────────────────────────────────────────────────────────────┘

-- 4.1 MEETINGS
CREATE TABLE dbo.Meetings (
    Id              INT            IDENTITY(1,1) NOT NULL,
    Title           NVARCHAR(300)  NOT NULL,
    Description     NVARCHAR(MAX)  NULL,
    Subject         NVARCHAR(MAX)  NULL,
    MeetingDate     DATE           NOT NULL,
    PlannedStart    TIME(0)        NULL,
    Status          NVARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    Version         INT            NOT NULL DEFAULT 0,
    ProjectId       INT            NULL,
    CompanyId       INT            NULL,
    LocationId      INT            NULL,
    CategoryId      INT            NULL,
    StartedAt       DATETIME2(3)   NULL,
    EndedAt         DATETIME2(3)   NULL,
    NextMeetingAt   DATETIME2(3)   NULL,
    NextMeetingNote NVARCHAR(500)  NULL,
    ExcelExportedAt DATETIME2(3)   NULL,
    CreatedBy       INT            NOT NULL,
    UpdatedBy       INT            NULL,
    CreatedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted       BIT            NOT NULL DEFAULT 0,
    DeletedAt       DATETIME2(3)   NULL,
    DeletedBy       INT            NULL,
    CONSTRAINT PK_Meetings PRIMARY KEY (Id),
    CONSTRAINT FK_Meetings_Status FOREIGN KEY (Status) REFERENCES dbo.LK_MeetingStatus(StatusCode),
    CONSTRAINT FK_Meetings_Project FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(Id),
    CONSTRAINT FK_Meetings_Company FOREIGN KEY (CompanyId) REFERENCES dbo.Companies(Id),
    CONSTRAINT FK_Meetings_Location FOREIGN KEY (LocationId) REFERENCES dbo.Locations(Id),
    CONSTRAINT FK_Meetings_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id),
    CONSTRAINT FK_Meetings_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Meetings_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Meetings_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT CK_Meetings_Status CHECK (Status IN ('DRAFT','ACTIVE','COMPLETED','EXPORTED'))
);
CREATE INDEX IX_Meetings_MeetingDate ON dbo.Meetings(MeetingDate);
CREATE INDEX IX_Meetings_Status ON dbo.Meetings(Status) WHERE IsDeleted = 0;
CREATE INDEX IX_Meetings_CreatedBy ON dbo.Meetings(CreatedBy) WHERE IsDeleted = 0;
CREATE INDEX IX_Meetings_ProjectId ON dbo.Meetings(ProjectId) WHERE ProjectId IS NOT NULL;
GO

-- 4.2 MEETING LINKS
CREATE TABLE dbo.MeetingLinks (
    Id                INT           IDENTITY(1,1) NOT NULL,
    ParentMeetingId   INT           NOT NULL,
    ChildMeetingId    INT           NOT NULL,
    RelationType      NVARCHAR(20)  NOT NULL,
    CreatedBy         INT           NOT NULL,
    CreatedAt         DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_MeetingLinks PRIMARY KEY (Id),
    CONSTRAINT FK_ML_Parent FOREIGN KEY (ParentMeetingId) REFERENCES dbo.Meetings(Id),
    CONSTRAINT FK_ML_Child FOREIGN KEY (ChildMeetingId) REFERENCES dbo.Meetings(Id),
    CONSTRAINT FK_ML_RelationType FOREIGN KEY (RelationType) REFERENCES dbo.LK_RelationType(TypeCode),
    CONSTRAINT FK_ML_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT UQ_MeetingLink UNIQUE (ParentMeetingId, ChildMeetingId),
    CONSTRAINT CK_MeetingLink_NoCycle CHECK (ParentMeetingId <> ChildMeetingId)
);
CREATE INDEX IX_ML_Parent ON dbo.MeetingLinks(ParentMeetingId);
CREATE INDEX IX_ML_Child ON dbo.MeetingLinks(ChildMeetingId);
GO

-- 4.3 MEETING PARTICIPANTS
CREATE TABLE dbo.MeetingParticipants (
    Id          INT           IDENTITY(1,1) NOT NULL,
    MeetingId   INT           NOT NULL,
    PersonId    INT           NOT NULL,
    Role        NVARCHAR(20)  NOT NULL DEFAULT 'ATTENDEE',
    CreatedBy   INT           NOT NULL,
    UpdatedBy   INT           NULL,
    CreatedAt   DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_MeetingParticipants PRIMARY KEY (Id),
    CONSTRAINT FK_MP_Meeting FOREIGN KEY (MeetingId) REFERENCES dbo.Meetings(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MP_Person FOREIGN KEY (PersonId) REFERENCES dbo.Persons(Id),
    CONSTRAINT FK_MP_Role FOREIGN KEY (Role) REFERENCES dbo.LK_ParticipantRole(RoleCode),
    CONSTRAINT FK_MP_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_MP_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT UQ_MeetingParticipant UNIQUE (MeetingId, PersonId)
);
CREATE INDEX IX_MP_MeetingId ON dbo.MeetingParticipants(MeetingId);
CREATE INDEX IX_MP_PersonId ON dbo.MeetingParticipants(PersonId);
GO

-- 4.4 NOTES
CREATE TABLE dbo.Notes (
    Id                    INT            IDENTITY(1,1) NOT NULL,
    MeetingId             INT            NOT NULL,
    Content               NVARCHAR(MAX)  NOT NULL,
    NoteType              NVARCHAR(20)   NOT NULL DEFAULT 'NOTE',
    DisplayOrder          INT            NOT NULL DEFAULT 0,
    ResponsiblePersonId   INT            NULL,
    DueDate               DATE           NULL,
    ActionStatus          NVARCHAR(20)   NULL,
    TopicId               INT            NULL,
    CreatedBy             INT            NOT NULL,
    UpdatedBy             INT            NULL,
    CreatedAt             DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt             DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted             BIT            NOT NULL DEFAULT 0,
    DeletedAt             DATETIME2(3)   NULL,
    DeletedBy             INT            NULL,
    CONSTRAINT PK_Notes PRIMARY KEY (Id),
    CONSTRAINT FK_Notes_Meeting FOREIGN KEY (MeetingId) REFERENCES dbo.Meetings(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Notes_NoteType FOREIGN KEY (NoteType) REFERENCES dbo.LK_NoteType(TypeCode),
    CONSTRAINT FK_Notes_Responsible FOREIGN KEY (ResponsiblePersonId) REFERENCES dbo.Persons(Id),
    CONSTRAINT FK_Notes_ActionStatus FOREIGN KEY (ActionStatus) REFERENCES dbo.LK_ActionStatus(StatusCode),
    CONSTRAINT FK_Notes_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Notes_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Notes_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id)
);
CREATE INDEX IX_Notes_MeetingId ON dbo.Notes(MeetingId) WHERE IsDeleted = 0;
CREATE INDEX IX_Notes_DueDate ON dbo.Notes(DueDate) WHERE DueDate IS NOT NULL AND IsDeleted = 0;
CREATE INDEX IX_Notes_TopicId ON dbo.Notes(TopicId) WHERE TopicId IS NOT NULL;
CREATE INDEX IX_Notes_NoteType ON dbo.Notes(NoteType) WHERE IsDeleted = 0;
CREATE INDEX IX_Notes_ResponsiblePerson ON dbo.Notes(ResponsiblePersonId) WHERE ResponsiblePersonId IS NOT NULL;
GO

-- 4.5 FOLLOWUP ITEMS
CREATE TABLE dbo.FollowupItems (
    Id                    INT            IDENTITY(1,1) NOT NULL,
    Text                  NVARCHAR(MAX)  NOT NULL,
    TopicId               INT            NULL,
    ResponsiblePersonId   INT            NULL,
    ResponsibleCompanyId  INT            NULL,
    DueDate               DATE           NULL,
    ActionStatus          NVARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    CompletedOn           DATE           NULL,
    WaitingReason         NVARCHAR(500)  NULL,
    DevelopmentNote       NVARCHAR(MAX)  NULL,
    BlockerItemId         INT            NULL,
    SourceMeetingId       INT            NULL,
    SourceNoteId          INT            NULL,
    Version               INT            NOT NULL DEFAULT 0,
    CreatedBy             INT            NOT NULL,
    UpdatedBy             INT            NULL,
    CreatedAt             DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt             DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted             BIT            NOT NULL DEFAULT 0,
    DeletedAt             DATETIME2(3)   NULL,
    DeletedBy             INT            NULL,
    CONSTRAINT PK_FollowupItems PRIMARY KEY (Id),
    CONSTRAINT FK_FI_ResponsiblePerson FOREIGN KEY (ResponsiblePersonId) REFERENCES dbo.Persons(Id),
    CONSTRAINT FK_FI_ResponsibleCompany FOREIGN KEY (ResponsibleCompanyId) REFERENCES dbo.Companies(Id),
    CONSTRAINT FK_FI_ActionStatus FOREIGN KEY (ActionStatus) REFERENCES dbo.LK_ActionStatus(StatusCode),
    CONSTRAINT FK_FI_Blocker FOREIGN KEY (BlockerItemId) REFERENCES dbo.FollowupItems(Id),
    CONSTRAINT FK_FI_SourceMeeting FOREIGN KEY (SourceMeetingId) REFERENCES dbo.Meetings(Id),
    CONSTRAINT FK_FI_SourceNote FOREIGN KEY (SourceNoteId) REFERENCES dbo.Notes(Id),
    CONSTRAINT FK_FI_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_FI_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_FI_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT CK_FI_NoCyclicBlocker CHECK (BlockerItemId <> Id)
);
CREATE INDEX IX_FI_DueDate ON dbo.FollowupItems(DueDate) WHERE DueDate IS NOT NULL AND IsDeleted = 0;
CREATE INDEX IX_FI_Status ON dbo.FollowupItems(ActionStatus) WHERE IsDeleted = 0;
CREATE INDEX IX_FI_SourceMeeting ON dbo.FollowupItems(SourceMeetingId) WHERE SourceMeetingId IS NOT NULL;
CREATE INDEX IX_FI_SourceNote ON dbo.FollowupItems(SourceNoteId) WHERE SourceNoteId IS NOT NULL;
GO

-- 4.6 FOLLOWUP CHANGE LOGS (Immutable — NO soft delete)
CREATE TABLE dbo.FollowupChangeLogs (
    Id              INT            IDENTITY(1,1) NOT NULL,
    FollowupId      INT            NOT NULL,
    Action          NVARCHAR(10)   NOT NULL,
    FieldName       NVARCHAR(50)   NULL,
    OldValue        NVARCHAR(500)  NULL,
    NewValue        NVARCHAR(500)  NULL,
    Description     NVARCHAR(500)  NOT NULL,
    ChangedBy       INT            NOT NULL,
    ChangedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_FollowupChangeLogs PRIMARY KEY (Id),
    CONSTRAINT FK_FCL_Followup FOREIGN KEY (FollowupId) REFERENCES dbo.FollowupItems(Id) ON DELETE CASCADE,
    CONSTRAINT FK_FCL_Action FOREIGN KEY (Action) REFERENCES dbo.LK_ChangeAction(ActionCode),
    CONSTRAINT FK_FCL_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES dbo.Users(Id)
);
CREATE INDEX IX_FCL_FollowupId ON dbo.FollowupChangeLogs(FollowupId);
CREATE INDEX IX_FCL_ChangedAt ON dbo.FollowupChangeLogs(ChangedAt DESC);
GO

-- 4.7 ATTACHMENTS (Polimorfik)
CREATE TABLE dbo.Attachments (
    Id              INT            IDENTITY(1,1) NOT NULL,
    EntityType      NVARCHAR(30)   NOT NULL,
    EntityId        INT            NOT NULL,
    FileName        NVARCHAR(500)  NOT NULL,
    FileExtension   NVARCHAR(10)   NOT NULL,
    FileSizeBytes   BIGINT         NOT NULL,
    MimeType        NVARCHAR(100)  NOT NULL,
    StoragePath     NVARCHAR(1000) NOT NULL,
    Description     NVARCHAR(500)  NULL,
    UploadedBy      INT            NOT NULL,
    CreatedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted       BIT            NOT NULL DEFAULT 0,
    DeletedAt       DATETIME2(3)   NULL,
    DeletedBy       INT            NULL,
    CONSTRAINT PK_Attachments PRIMARY KEY (Id),
    CONSTRAINT FK_Att_UploadedBy FOREIGN KEY (UploadedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Att_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT CK_Att_EntityType CHECK (EntityType IN ('MEETING', 'NOTE', 'FOLLOWUP'))
);
CREATE INDEX IX_Att_Entity ON dbo.Attachments(EntityType, EntityId) WHERE IsDeleted = 0;
CREATE INDEX IX_Att_UploadedBy ON dbo.Attachments(UploadedBy);
GO


-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BÖLÜM 5: HESAPLANMIŞ VIEW'LAR (2 adet)                       │
-- └─────────────────────────────────────────────────────────────────┘

CREATE OR ALTER VIEW dbo.vw_FollowupWithBucket AS
SELECT
    fi.Id, fi.Text, fi.TopicId,
    fi.ResponsiblePersonId,
    p.FullName AS ResponsiblePersonName,
    fi.ResponsibleCompanyId,
    c.Name AS ResponsibleCompanyName,
    fi.DueDate, fi.ActionStatus, fi.CompletedOn,
    fi.WaitingReason, fi.DevelopmentNote, fi.BlockerItemId,
    fi.SourceMeetingId,
    m.Title AS SourceMeetingTitle,
    m.MeetingDate AS SourceMeetingDate,
    fi.SourceNoteId, fi.Version,
    fi.CreatedBy, fi.CreatedAt, fi.UpdatedAt,
    CASE
        WHEN fi.ActionStatus IN ('DONE', 'CANCELLED')                THEN 'CLOSED'
        WHEN fi.DueDate IS NULL                                      THEN 'NO_DATE'
        WHEN fi.DueDate < CAST(GETDATE() AS DATE)                   THEN 'OVERDUE'
        WHEN fi.DueDate = CAST(GETDATE() AS DATE)                   THEN 'TODAY'
        WHEN fi.DueDate <= DATEADD(DAY, 7, CAST(GETDATE() AS DATE)) THEN 'SOON'
        ELSE 'LATER'
    END AS Bucket
FROM dbo.FollowupItems fi
LEFT JOIN dbo.Persons p   ON fi.ResponsiblePersonId = p.Id
LEFT JOIN dbo.Companies c ON fi.ResponsibleCompanyId = c.Id
LEFT JOIN dbo.Meetings m  ON fi.SourceMeetingId = m.Id
WHERE fi.IsDeleted = 0;
GO

CREATE OR ALTER VIEW dbo.vw_MeetingAccessCheck AS
SELECT DISTINCT
    m.Id AS MeetingId,
    u.Id AS UserId,
    CASE
        WHEN m.CreatedBy = u.Id THEN 'OWNER'
        WHEN mp.Id IS NOT NULL  THEN 'PARTICIPANT'
        WHEN u.IsSuperuser = 1  THEN 'ADMIN'
    END AS AccessType
FROM dbo.Meetings m
CROSS JOIN dbo.Users u
LEFT JOIN dbo.MeetingParticipants mp
    ON mp.MeetingId = m.Id
    AND mp.PersonId IN (
        SELECT p.Id FROM dbo.Persons p WHERE p.LinkedUserId = u.Id
    )
WHERE m.IsDeleted = 0
  AND u.IsActive = 1
  AND (m.CreatedBy = u.Id OR mp.Id IS NOT NULL OR u.IsSuperuser = 1);
GO


-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BÖLÜM 6: SEED DATA                                           │
-- └─────────────────────────────────────────────────────────────────┘

INSERT INTO dbo.Users (Email, HashedPassword, FullName, IsActive, IsSuperuser) VALUES
    (N'admin@example.com', N'$2b$12$LJ3m4wVbPpHE7PEUb8gq0OMc1qkXqIqOBVZxGhFyNp3tPjKVLGcEG', N'Sistem Yöneticisi', 1, 1);
GO

PRINT N'══════════════════════════════════════════════════════════';
PRINT N'  Toplantı Yönetimi veritabanı şeması başarıyla kuruldu.';
PRINT N'  Toplam: 20 tablo + 2 VIEW oluşturuldu.';
PRINT N'══════════════════════════════════════════════════════════';
GO
