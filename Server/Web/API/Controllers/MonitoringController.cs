using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitoringController : ControllerBase
{
    [HttpGet("logs")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLogsByDate([FromQuery] string? date)
    {
        // Parse incoming date (yyyy-MM-dd) or fallback to UTC Today
        DateTime targetDate = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(date))
        {
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out targetDate))
            {
                return BadRequest("Invalid date format. Use YYYY-MM-DD.");
            }
        }

        // Generate filename matching your Serilog convention (e.g., log-20260610.txt)
        string logFileName = $"log-{targetDate:yyyyMMdd}.txt";

        string pathOptionA = Path.Combine(AppContext.BaseDirectory, "bin", "logs", logFileName);
        string pathOptionB = Path.Combine(Directory.GetCurrentDirectory(), "bin", "logs", logFileName);
        string pathOptionC = Path.Combine(AppContext.BaseDirectory, "logs", logFileName);

        string finalLogFilePath = string.Empty;

        if (System.IO.File.Exists(pathOptionA)) finalLogFilePath = pathOptionA;
        else if (System.IO.File.Exists(pathOptionB)) finalLogFilePath = pathOptionB;
        else if (System.IO.File.Exists(pathOptionC)) finalLogFilePath = pathOptionC;

        if (string.IsNullOrEmpty(finalLogFilePath))
        {
            var errorMessage = $"No log entries found for {targetDate:yyyy-MM-dd}.\n\n" +
                               $"Checked Locations:\n" +
                               $"- {pathOptionA}\n" +
                               $"- {pathOptionB}\n" +
                               $"- {pathOptionC}";

            return Content(errorMessage, "text/plain; charset=utf-8");
        }

        try
        {
            using var fileStream = new FileStream(finalLogFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var streamReader = new StreamReader(fileStream);

            var logContent = await streamReader.ReadToEndAsync();
            return Content(logContent, "text/plain; charset=utf-8");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Unable to read log file: {ex.Message}");
        }
    }
}
