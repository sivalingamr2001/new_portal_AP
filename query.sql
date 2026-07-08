CREATE TABLE jan_access_requests
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ReqTo NVARCHAR(MAX) NULL,
    IsAgreed BIT NOT NULL,
    ITSRNo NVARCHAR(100) NULL,
    CurrentStatus INT NOT NULL,
    CurrentApproverId INT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

⸻

CREATE TABLE jan_access_items
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccessRequestId INT NOT NULL,
    TicketNumber NVARCHAR(100) NOT NULL,
    Status INT NOT NULL,
    FolderPath NVARCHAR(1000) NOT NULL,
    AccessType INT NOT NULL,
    ConfirmAccessType INT NOT NULL,
    Reason NVARCHAR(2000) NOT NULL,
    RejectionReason NVARCHAR(2000) NULL,
    HodApproverId INT NULL,
    ItApproverId INT NULL,
    ApprovedAtUtc DATETIME2 NULL,
    ExpiresAtUtc DATETIME2 NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

⸻

CREATE TABLE jan_access_approvals
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccessRequestId INT NOT NULL,
    AccessItemId INT NOT NULL,
    ApproverId INT NOT NULL,
    ApprovalStatus INT NOT NULL,
    ApprovalLevel NVARCHAR(100) NOT NULL,
    Comments NVARCHAR(2000) NOT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

⸻

CREATE TABLE jan_access_req_audits
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccessRequestId INT NOT NULL,
    AccessItemId INT NULL,
    AccessApprovalId INT NULL,
    EventType NVARCHAR(100) NOT NULL,
    Message NVARCHAR(2000) NOT NULL,
    RecipientUserId INT NOT NULL,
    RecipientName NVARCHAR(255) NOT NULL,
    RecipientRole NVARCHAR(100) NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    ActorUserId INT NULL,
    TicketNumber NVARCHAR(50) NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

⸻

CREATE TABLE jan_folder_mappings
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FolderName NVARCHAR(500) NOT NULL,
    PrimaryHodId NVARCHAR(255) NULL,
    PrimaryHodName NVARCHAR(255) NULL,
    PrimaryHodEmail NVARCHAR(255) NULL,
    SecondaryHodId NVARCHAR(255) NULL,
    SecondaryHodName NVARCHAR(255) NULL,
    SecondaryHodEmail NVARCHAR(255) NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

⸻

CREATE TABLE jan_portal_users
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Role NVARCHAR(100) NOT NULL,
    Location NVARCHAR(255) NOT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

⸻

CREATE TABLE jan_ntfs_permissions_audit
(
    AuditId INT PRIMARY KEY,
    ScanDate DATETIME2 NOT NULL,
    FolderPath NVARCHAR(MAX) NOT NULL,
    AssignedIdentity NVARCHAR(1000) NOT NULL,
    IdentityType NVARCHAR(500) NOT NULL,
    AccessControlType NVARCHAR(500) NOT NULL,
    FileSystemRights NVARCHAR(MAX) NOT NULL,
    ResolvedUser NVARCHAR(1000) NOT NULL,
    GroupName NVARCHAR(1000) NOT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
CREATE INDEX IX_jan_ntfs_permissions_audit_ScanDate
ON jan_ntfs_permissions_audit(ScanDate);
CREATE INDEX IX_jan_ntfs_permissions_audit_AssignedIdentity
ON jan_ntfs_permissions_audit(AssignedIdentity);

⸻

CREATE TABLE CmplUsers
(
    CMPL_USER_ID INT PRIMARY KEY,
    CMPL_USER_NAME NVARCHAR(255) NULL,
    CMPL_USER_KEY NVARCHAR(255) NULL,
    EMP_ID NVARCHAR(100) NULL,
    MAIL_ID NVARCHAR(255) NULL,
    MOB_NO BIGINT NULL,
    DEPT_ID INT NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedOn DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

