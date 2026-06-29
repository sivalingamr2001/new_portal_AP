using Microsoft.EntityFrameworkCore;
using Web.Infrastructure.Data;

namespace Web.Infrastructure.Utilities;

/// <summary>
/// Generates unique per-item ticket numbers sequentially per year.
/// Format: REQ-YYYY-FFFF (where FFFF is a 4-digit padded sequence)
/// Example: REQ-2026-0001, REQ-2026-0002
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
            var yearPart = DateTime.UtcNow.ToString("yyyy");
            var prefix = $"REQ-{yearPart}-";

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

            return $"{prefix}{nextSequence:D4}";
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
