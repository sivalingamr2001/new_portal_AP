using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;

namespace Web.Infrastructure.Data;

public sealed class CmplDbContext(DbContextOptions<CmplDbContext> options) : DbContext(options)
{
    public DbSet<CmplUser> CmplUsers => Set<CmplUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<CmplUser>().HasKey(c => c.Id);
        modelBuilder.Entity<CmplUser>().ToTable("jan_complaint_login", t => t.ExcludeFromMigrations());
    }
}

public sealed class HodDbContext(DbContextOptions<HodDbContext> options) : DbContext(options)
{
    public DbSet<HodMaster> HodMasters => Set<HodMaster>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<HodMaster>().HasKey(h => h.UserId);
        modelBuilder.Entity<HodMaster>().ToTable("hod_master", t => t.ExcludeFromMigrations());
    }
}
