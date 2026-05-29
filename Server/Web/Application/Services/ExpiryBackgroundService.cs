using Web.Application.Interfaces;

namespace Web.Application.Services;

public sealed class ExpiryBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpiryBackgroundService> _logger;

    public ExpiryBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<ExpiryBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var approvalService = scope.ServiceProvider.GetRequiredService<IApprovalService>();

                var expiredCount = await approvalService.ExpireApprovedRequestsAsync(DateTime.UtcNow);

                if (expiredCount > 0)
                {
                    _logger.LogInformation(
                        "ExpiryBackgroundService expired {ExpiredCount} approved access request items.",
                        expiredCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing request expiry workflow.");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
