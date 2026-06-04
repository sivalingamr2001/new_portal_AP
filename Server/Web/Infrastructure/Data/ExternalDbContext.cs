using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;

namespace Web.Infrastructure.Data;

// Context for CMPL Users
public sealed class CmplDbContext : DbContext
{
    public CmplDbContext(DbContextOptions<CmplDbContext> options) : base(options) { }

    public DbSet<CmplUser> CmplUsers => Set<CmplUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<CmplUser>().HasKey(c => c.Id);
        modelBuilder.Entity<CmplUser>().ToTable("jan_complaint_login", t => t.ExcludeFromMigrations());
    }
}

// Context for HOD Masters
public sealed class HodDbContext : DbContext
{
    public HodDbContext(DbContextOptions<HodDbContext> options) : base(options) { }

    public DbSet<HodMaster> HodMasters => Set<HodMaster>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<HodMaster>().HasKey(h => h.UserId);
        modelBuilder.Entity<HodMaster>().ToTable("hod_master", t => t.ExcludeFromMigrations());
    }
}
