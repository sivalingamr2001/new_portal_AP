using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;

namespace Web.Infrastructure.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<FolderMappingEntity> FolderMappings => Set<FolderMappingEntity>();
    public DbSet<AccessRequestEntity> AccessRequests => Set<AccessRequestEntity>();
    public DbSet<AccessItemEntity> AccessItems => Set<AccessItemEntity>();
    public DbSet<AccessApprovalEntity> AccessApprovals => Set<AccessApprovalEntity>();
    public DbSet<AccessReqAuditEntity> AccessReqAudits => Set<AccessReqAuditEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<Department>().HasKey(d => d.Id);
        modelBuilder.Entity<CmplUser>().HasKey(c => c.Id);
        modelBuilder.Entity<HodMaster>().HasKey(h => h.UserId);
        modelBuilder.Entity<FolderMappingEntity>().HasKey(f => f.Id);
        modelBuilder.Entity<AccessRequestEntity>().HasKey(a => a.AccessReqId);
        modelBuilder.Entity<AccessItemEntity>().HasKey(a => a.AccessItemId);
        modelBuilder.Entity<AccessApprovalEntity>().HasKey(a => a.AccessApproveId);
        modelBuilder.Entity<AccessReqAuditEntity>().HasKey(a => a.AuditId);

        modelBuilder.Entity<AccessRequestEntity>()
            .HasMany(a => a.AccessItems)
            .WithOne()
            .HasForeignKey(i => i.AccessReqId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
