using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace Web.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<FolderMappingEntity> FolderMappings => Set<FolderMappingEntity>();
    public DbSet<JanNtfsPermissionsAudit> Folders => Set<JanNtfsPermissionsAudit>();
    public DbSet<AccessRequestEntity> AccessRequests => Set<AccessRequestEntity>();
    public DbSet<AccessItemEntity> AccessItems => Set<AccessItemEntity>();
    public DbSet<AccessApprovalEntity> AccessApprovals => Set<AccessApprovalEntity>();
    public DbSet<AccessReqAuditEntity> AccessReqAudits => Set<AccessReqAuditEntity>();
    public DbSet<CmplUser> CmplUsers => Set<CmplUser>();
    public DbSet<HodMaster> HodMasters => Set<HodMaster>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =========================================================================
        // 1. PRIMARY KEY CONFIGURATIONS
        // =========================================================================
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<Department>().HasKey(d => d.Id);
        modelBuilder.Entity<FolderMappingEntity>().HasKey(f => f.Id);
        modelBuilder.Entity<AccessRequestEntity>().HasKey(a => a.AccessReqId);
        modelBuilder.Entity<AccessItemEntity>().HasKey(a => a.AccessItemId);
        modelBuilder.Entity<AccessApprovalEntity>().HasKey(a => a.AccessApproveId);
        modelBuilder.Entity<AccessReqAuditEntity>().HasKey(a => a.AuditId);

        // =========================================================================
        // 2. RELATIONSHIP MAPPINGS (CASCADE DELETES)
        // =========================================================================
        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessItems)
            .WithOne(i => i.AccessRequest)
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);

        // Request -> Approvals
        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessApprovals)
            .WithOne()
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);

        // Request -> Audits
        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessAudits)
            .WithOne()
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);

        // Item -> Approvals
        modelBuilder.Entity<AccessItemEntity>()
            .HasMany(a => a.AccessApprovals)
            .WithOne()
            .HasForeignKey(i => i.AccessItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Item -> Audits
        modelBuilder.Entity<AccessItemEntity>()
            .HasMany(a => a.AccessAudits)
            .WithOne()
            .HasForeignKey(i => i.AccessItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // =========================================================================
        // 3. MYSQL INDEX & LENGTH CRITICAL CONSTRAINT WORKAROUNDS
        // =========================================================================
        modelBuilder.Entity<JanNtfsPermissionsAudit>(entity =>
        {
            // Explicitly locks lengths inside Fluent API to avoid 3072 byte index overflows
            entity.Property(e => e.AssignedIdentity).HasMaxLength(255);
            entity.Property(e => e.IdentityType).HasMaxLength(100);
            entity.Property(e => e.AccessControlType).HasMaxLength(100);
            entity.Property(e => e.ResolvedUser).HasMaxLength(255);
            entity.Property(e => e.GroupName).HasMaxLength(255);
        });

        // =========================================================================
        // 4. ENVIRONMENT DB PROVIDER LOGIC
        // =========================================================================
        var dbProvider = configuration.GetValue<string>("Database:Provider");
        if (!string.Equals(dbProvider, "MySQL", StringComparison.OrdinalIgnoreCase))
        {
            modelBuilder.Entity<CmplUser>().HasKey(c => c.Id);
            modelBuilder.Entity<HodMaster>().HasKey(h => h.UserId);
        }
        else
        {
            modelBuilder.Ignore<CmplUser>();
            modelBuilder.Ignore<HodMaster>();
        }
    }
}
