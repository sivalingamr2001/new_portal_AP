using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;
using Web.Infrastructure.Data;

namespace Web.Application.Services;

public class DailyUserDeptSyncService(IServiceProvider serviceProvider, ILogger<DailyUserDeptSyncService> logger) : BackgroundService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly ILogger<DailyUserDeptSyncService> _logger = logger;

    private const int SyncHour = 4; // 4:00 AM

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Daily Sync Service has started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = now.Date.AddHours(SyncHour);

            if (now >= nextRun)
            {
                nextRun = nextRun.AddDays(1);
            }

            var delay = nextRun - now;
            _logger.LogInformation("Next sync scheduled at: {Time}. Sleeping for {Delay}", nextRun, delay);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }

            try
            {
                _logger.LogInformation("Starting morning sync process...");
                await ExecuteSyncAsync(stoppingToken);
                _logger.LogInformation("Morning sync completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during the daily sync execution.");
            }
        }
    }

    private async Task ExecuteSyncAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var cmplDb = scope.ServiceProvider.GetRequiredService<CmplDbContext>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        bool isTestEnv = db.Database.IsSqlite();

        var sourceUserIds = isTestEnv
            ? await db.CmplUsers
            .Where(u => u.Id > 0)
            .Select(u => u.Id)
            .Distinct()
            .ToListAsync(stoppingToken)
            : await cmplDb.CmplUsers
            .Where(u => u.Id > 0)
            .Select(u => u.Id)
            .Distinct()
            .ToListAsync(stoppingToken);

        var existingUserIds = await db.Users
            .Where(u => sourceUserIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync(stoppingToken);

        var missingUserIds = sourceUserIds.Except(existingUserIds).ToList();

        if (missingUserIds.Any())
        {
            var newUsers = missingUserIds.Select(id => new User
            {
                Id = id,
                Role = "User",
                Location = string.Empty
            }).ToList();

            await db.Users.AddRangeAsync(newUsers, stoppingToken);
            await db.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Successfully inserted {Count} new users into jan_portal_users.", newUsers.Count);
        }
        else
        {
            _logger.LogInformation("All portal users are already up to date.");
        }

        var sourceDeptIds = isTestEnv
            ? await db.CmplUsers
                .Where(u => u.DepartmentId != null && u.DepartmentId > 0)
                .Select(u => u.DepartmentId!.Value)
                .Distinct()
                .ToListAsync(stoppingToken)
            : await cmplDb.CmplUsers
                .Where(u => u.DepartmentId != null && u.DepartmentId > 0)
                .Select(u => u.DepartmentId!.Value)
                .Distinct()
                .ToListAsync(stoppingToken);

        var existingDeptIds = await db.Departments
            .Where(d => sourceDeptIds.Contains(d.Id))
            .Select(d => d.Id)
            .ToListAsync(stoppingToken);

        var missingDeptIds = sourceDeptIds.Except(existingDeptIds).ToList();

        if (missingDeptIds.Any())
        {
            var newDepartments = missingDeptIds.Select(id => new Department
            {
                Id = id,
                Name = null,
                HodId = string.Empty
            }).ToList();

            await db.Departments.AddRangeAsync(newDepartments, stoppingToken);
            await db.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Successfully inserted {Count} new departments.", newDepartments.Count);
        }
        else
        {
            _logger.LogInformation("All departments are already up to date.");
        }
    }

    public async Task TriggerSyncAsync(CancellationToken stoppingToken)
    {
        try
        {
            _logger.LogInformation("Manual on-demand sync triggered via UserService.");
            await ExecuteSyncAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during the on-demand sync execution.");
        }
    }
}
