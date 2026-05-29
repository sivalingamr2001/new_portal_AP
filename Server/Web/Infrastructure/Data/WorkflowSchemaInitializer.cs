using Microsoft.EntityFrameworkCore;

namespace Web.Infrastructure.Data;

public static class WorkflowSchemaInitializer
{
    public static async Task EnsureCreatedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_folder_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                folder_name TEXT NOT NULL,
                primary_hod_id TEXT NULL,
                primary_hod_name TEXT NULL,
                primary_hod_email TEXT NULL,
                secondary_hod_id TEXT NULL,
                secondary_hod_name TEXT NULL,
                secondary_hod_email TEXT NULL
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessrequest (
                accessreq_id INTEGER PRIMARY KEY AUTOINCREMENT,
                User_id INTEGER NOT NULL,
                req_to INTEGER NOT NULL,
                is_agreed INTEGER NOT NULL,
                itsr_no TEXT NULL,
                current_status INTEGER NOT NULL,
                current_approver_id INTEGER NULL,
                requested_at_utc TEXT NOT NULL,
                last_action_at_utc TEXT NOT NULL
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessitems (
                accessitem_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_number TEXT NOT NULL,
                accessreq_id INTEGER NOT NULL,
                status INTEGER NOT NULL,
                folder_path TEXT NOT NULL,
                access_type INTEGER NOT NULL,
                confirm_access_type INTEGER NOT NULL,
                reason TEXT NOT NULL,
                rejection_reason TEXT NULL,
                hod_approver_id INTEGER NULL,
                it_approver_id INTEGER NULL,
                requested_at_utc TEXT NOT NULL,
                last_action_at_utc TEXT NOT NULL,
                approved_at_utc TEXT NULL,
                expires_at_utc TEXT NULL,
                FOREIGN KEY(accessreq_id) REFERENCES jan_accessrequest(accessreq_id) ON DELETE CASCADE
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessapproval (
                accessapprove_id INTEGER PRIMARY KEY AUTOINCREMENT,
                accessreq_id INTEGER NOT NULL,
                accessitem_id INTEGER NOT NULL,
                approver_id INTEGER NOT NULL,
                approval_status INTEGER NOT NULL,
                comments TEXT NOT NULL,
                approval_level TEXT NOT NULL,
                actioned_at_utc TEXT NOT NULL
            );
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS jan_accessreqaudit (
                audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                accessreq_id INTEGER NOT NULL,
                accessitem_id INTEGER NULL,
                accessapprove_id INTEGER NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                recipient_user_id INTEGER NOT NULL,
                recipient_name TEXT NOT NULL,
                recipient_role TEXT NOT NULL,
                is_read INTEGER NOT NULL DEFAULT 0,
                actor_user_id INTEGER NULL,
                created_at_utc TEXT NOT NULL
            );
            """);
    }
}
