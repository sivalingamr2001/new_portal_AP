using global::Server.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Server.Infrastructure.Data;

public sealed class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions options) : base(options)
    {
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
    }

    public DbSet<UserAccount> Users => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserAccount>(builder =>
        {
            builder.ToTable("jan_complaint_login");
            builder.HasKey(x => x.UserId);
        });
    }

    public override int SaveChanges() => base.SaveChanges();

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
        => base.SaveChanges(acceptAllChangesOnSuccess);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => base.SaveChangesAsync(cancellationToken);

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        => base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
}
