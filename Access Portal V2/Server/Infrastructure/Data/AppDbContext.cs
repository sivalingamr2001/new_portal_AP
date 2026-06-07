using global::Server.Core.Domain.Entities;
using global::Server.Core.Domain.Common;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Server.Infrastructure.Data;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ICurrentUserProvider currentUserProvider) : DbContext(options)
{
    public DbSet<UserDetail> UserDetails => Set<UserDetail>();
    public DbSet<DepartmentEntity> Departments => Set<DepartmentEntity>();
    public DbSet<AccessRequestEntity> AccessRequests => Set<AccessRequestEntity>();
    public DbSet<AccessItemEntity> AccessItems => Set<AccessItemEntity>();
    public DbSet<AccessApprovalEntity> Approvals => Set<AccessApprovalEntity>();
    public DbSet<AccessReqAuditEntity> AccessReqAudits => Set<AccessReqAuditEntity>();
    public DbSet<FolderMappingEntity> FolderMappings => Set<FolderMappingEntity>();
    public DbSet<FolderEntity> Folders => Set<FolderEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditLogValues();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditLogValues();
        return base.SaveChanges();
    }

    private void ApplyAuditLogValues()
    {
        var currentUserId = currentUserProvider.GetUserId();
        var currentUtcTime = DateTime.UtcNow;

        var entries = ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedOn = currentUtcTime;
                entry.Entity.CreatedBy = currentUserId;
                entry.Entity.IsActive = true;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(x => x.CreatedOn).IsModified = false;
                entry.Property(x => x.CreatedBy).IsModified = false;

                entry.Entity.ModifiedOn = currentUtcTime;
                entry.Entity.ModifiedBy = currentUserId;
            }
        }
    }
}
