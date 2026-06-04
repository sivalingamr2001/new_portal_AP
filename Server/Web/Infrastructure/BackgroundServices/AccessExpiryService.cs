using Microsoft.EntityFrameworkCore;
using Web.Domain.Enums;
using Web.Infrastructure.Data;

namespace Web.Infrastructure.BackgroundServices;

public sealed class AccessExpiryService(IServiceProvider serviceProvider, ILogger<AccessExpiryService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run once per day
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            try
            {
                using var scope = serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var expiredCount = await db.AccessItems
                    .Where(i => i.Status == RequestStatus.ItApproved
                             && i.ExpiresAtUtc.HasValue
                             && i.ExpiresAtUtc.Value < DateTime.UtcNow)
                    .ExecuteUpdateAsync(s =>
                        s.SetProperty(i => i.Status, RequestStatus.Expired),
                        stoppingToken);

                logger.LogInformation("Expired {Count} access items.", expiredCount);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in AccessExpiryService.");
            }
        }
    }
}
