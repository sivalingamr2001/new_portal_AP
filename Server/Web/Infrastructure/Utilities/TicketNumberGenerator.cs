using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Web.Infrastructure.Data;

namespace Web.Infrastructure.Utilities;

/// <summary>
/// Generates unique per-item ticket numbers sequentially per day.
/// Format: REQ-YYYYMMDD-FFF (where FFF is a 3-digit padded sequence)
/// Example: REQ-20260608-001, REQ-20260608-002
/// </summary>
public static class TicketNumberGenerator
{
    public static async Task<string> GenerateAsync(AppDbContext db)
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"REQ-{datePart}-";

        // 1. Find the highest existing ticket number for today in the database
        var lastTicket = await db.AccessItems
            .Where(i => i.TicketNumber != null && i.TicketNumber.StartsWith(prefix))
            .OrderByDescending(i => i.TicketNumber)
            .Select(i => i.TicketNumber)
            .FirstOrDefaultAsync();

        int nextSequence = 1;

        // 2. If a ticket exists for today, parse out the last 3 digits and increment
        if (lastTicket != null)
        {
            var parts = lastTicket.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int lastSequence))
            {
                nextSequence = lastSequence + 1;
            }
        }

        // 3. Return the padded string: "REQ-20260608-001"
        return $"{prefix}{nextSequence:D3}";
    }
}
