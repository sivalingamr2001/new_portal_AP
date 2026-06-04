using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;

namespace Web.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<FolderMappingEntity> FolderMappings => Set<FolderMappingEntity>();
    public DbSet<AccessRequestEntity> AccessRequests => Set<AccessRequestEntity>();
    public DbSet<AccessItemEntity> AccessItems => Set<AccessItemEntity>();
    public DbSet<AccessApprovalEntity> AccessApprovals => Set<AccessApprovalEntity>();
    public DbSet<AccessReqAuditEntity> AccessReqAudits => Set<AccessReqAuditEntity>();
    public DbSet<CmplUser> CmplUsers => Set<CmplUser>();
    public DbSet<HodMaster> HodMasters => Set<HodMaster>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Primary Keys
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<Department>().HasKey(d => d.Id);
        modelBuilder.Entity<FolderMappingEntity>().HasKey(f => f.Id);
        modelBuilder.Entity<AccessRequestEntity>().HasKey(a => a.AccessReqId);
        modelBuilder.Entity<AccessItemEntity>().HasKey(a => a.AccessItemId);
        modelBuilder.Entity<AccessApprovalEntity>().HasKey(a => a.AccessApproveId);
        modelBuilder.Entity<AccessReqAuditEntity>().HasKey(a => a.AuditId);

        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessItems)
            .WithOne(i => i.AccessRequest)
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);

        // 2. One-Way Mapping: Request -> Approvals
        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessApprovals)
            .WithOne()
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. One-Way Mapping: Request -> Audits
        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessAudits)
            .WithOne()
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. One-Way Mapping: Item -> Approvals
        modelBuilder.Entity<AccessItemEntity>()
            .HasMany(a => a.AccessApprovals)
            .WithOne()
            .HasForeignKey(i => i.AccessItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // 5. One-Way Mapping: Item -> Audits
        modelBuilder.Entity<AccessItemEntity>()
            .HasMany(a => a.AccessAudits)
            .WithOne()
            .HasForeignKey(i => i.AccessItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Environment Provider Logic
        var dbProvider = configuration.GetValue<string>("Database:Provider");
        if (dbProvider != "MySQL")
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
