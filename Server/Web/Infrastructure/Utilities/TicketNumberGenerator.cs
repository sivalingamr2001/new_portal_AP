namespace Web.Infrastructure.Utilities;

/// <summary>
/// Generates unique per-item ticket numbers.
/// Format: ITSR-YYYYMMDD-{6-char random alphanumeric}
/// Example: ITSR-20250604-A3X9K2
/// </summary>
public static class TicketNumberGenerator
{
    private static readonly char[] Chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray(); // removes ambiguous chars

    public static string Generate()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = GenerateRandomSegment(6);
        return $"ITSR-{datePart}-{randomPart}";
    }

    private static string GenerateRandomSegment(int length)
    {
        var result = new char[length];
        var buffer = new byte[length];
        System.Security.Cryptography.RandomNumberGenerator.Fill(buffer);
        for (int i = 0; i < length; i++)
            result[i] = Chars[buffer[i] % Chars.Length];
        return new string(result);
    }
}