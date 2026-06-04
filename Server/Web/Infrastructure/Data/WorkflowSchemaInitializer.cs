using Microsoft.EntityFrameworkCore;

namespace Web.Infrastructure.Data;

public static class WorkflowSchemaInitializer
{
    public static async Task EnsureCreatedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_folder_mappings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folder_name VARCHAR(500) NOT NULL,
                primary_hod_id VARCHAR(255) NULL,
                primary_hod_name VARCHAR(255) NULL,
                primary_hod_email VARCHAR(255) NULL,
                secondary_hod_id VARCHAR(255) NULL,
                secondary_hod_name VARCHAR(255) NULL,
                secondary_hod_email VARCHAR(255) NULL,
                IsActive TINYINT NOT NULL DEFAULT 1,
                CreatedOn DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
                ModifiedOn DATETIME NULL,
                CreatedBy INT NOT NULL DEFAULT 0,
                ModifiedBy INT NULL
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessrequest (
                accessreq_id INT AUTO_INCREMENT PRIMARY KEY,
                User_id INT NOT NULL,
                req_to INT NOT NULL,
                is_agreed TINYINT NOT NULL,
                itsr_no VARCHAR(255) NULL,
                current_status INT NOT NULL,
                current_approver_id INT NULL,
                requested_at_utc DATETIME NOT NULL,
                last_action_at_utc DATETIME NOT NULL,
                IsActive TINYINT NOT NULL DEFAULT 1,
                CreatedOn DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
                ModifiedOn DATETIME NULL,
                CreatedBy INT NOT NULL DEFAULT 0,
                ModifiedBy INT NULL
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessitems (
                accessitem_id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_number VARCHAR(255) NOT NULL,
                accessreq_id INT NOT NULL,
                status INT NOT NULL,
                folder_path VARCHAR(1000) NOT NULL,
                access_type INT NOT NULL,
                confirm_access_type INT NOT NULL,
                reason LONGTEXT NOT NULL,
                rejection_reason LONGTEXT NULL,
                hod_approver_id INT NULL,
                it_approver_id INT NULL,
                requested_at_utc DATETIME NOT NULL,
                last_action_at_utc DATETIME NOT NULL,
                approved_at_utc DATETIME NULL,
                expires_at_utc DATETIME NULL,
                IsActive TINYINT NOT NULL DEFAULT 1,
                CreatedOn DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
                ModifiedOn DATETIME NULL,
                CreatedBy INT NOT NULL DEFAULT 0,
                ModifiedBy INT NULL,
                FOREIGN KEY (accessreq_id) REFERENCES jan_accessrequest(accessreq_id) ON DELETE CASCADE
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessapproval (
                accessapprove_id INT AUTO_INCREMENT PRIMARY KEY,
                accessreq_id INT NOT NULL,
                accessitem_id INT NOT NULL,
                approver_id INT NOT NULL,
                approval_status INT NOT NULL,
                comments LONGTEXT NOT NULL,
                approval_level VARCHAR(255) NOT NULL,
                actioned_at_utc DATETIME NOT NULL,
                IsActive TINYINT NOT NULL DEFAULT 1,
                CreatedOn DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
                ModifiedOn DATETIME NULL,
                CreatedBy INT NOT NULL DEFAULT 0,
                ModifiedBy INT NULL
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessreqaudit (
                audit_id INT AUTO_INCREMENT PRIMARY KEY,
                accessreq_id INT NOT NULL,
                accessitem_id INT NULL,
                accessapprove_id INT NULL,
                event_type VARCHAR(255) NOT NULL,
                message LONGTEXT NOT NULL,
                recipient_user_id INT NOT NULL,
                recipient_name VARCHAR(255) NOT NULL,
                recipient_role VARCHAR(255) NOT NULL,
                is_read TINYINT NOT NULL DEFAULT 0,
                actor_user_id INT NULL,
                created_at_utc DATETIME NOT NULL,
                IsActive TINYINT NOT NULL DEFAULT 1,
                CreatedOn DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
                ModifiedOn DATETIME NULL,
                CreatedBy INT NOT NULL DEFAULT 0,
                ModifiedBy INT NULL
            );
            """);
    }
}
