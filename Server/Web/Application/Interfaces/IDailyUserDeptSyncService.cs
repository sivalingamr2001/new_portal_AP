namespace Web.Application.Interfaces;

public interface IDailyUserDeptSyncService
{
    Task TriggerSyncAsync(CancellationToken stoppingToken);
}
