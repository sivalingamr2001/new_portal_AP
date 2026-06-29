using Microsoft.EntityFrameworkCore;
using Web.Infrastructure.Data;

namespace Web.Infrastructure.Utilities;

/// <summary>
/// Generates unique per-item ticket numbers sequentially per day.
/// Format: REQ-YYYYMMDD-FFF (where FFF is a 3-digit padded sequence)
/// Example: REQ-20260608-001, REQ-20260608-002
/// Supports a batch offset to safely handle multi-item requests saved within a single database transaction.
/// </summary>
public static class TicketNumberGenerator
{
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public static async Task<string> GenerateAsync(AppDbContext db, int batchOffset = 0)
    {
        await _semaphore.WaitAsync();
        try
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            var prefix = $"REQ-{datePart}-";

            var lastTicket = await db.AccessItems
                .Where(i => i.TicketNumber != null && i.TicketNumber.StartsWith(prefix))
                .OrderByDescending(i => i.TicketNumber)
                .Select(i => i.TicketNumber)
                .FirstOrDefaultAsync();

            int nextSequence = 1;

            if (lastTicket != null)
            {
                var parts = lastTicket.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            nextSequence += batchOffset;

            return $"{prefix}{nextSequence:D3}";
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
