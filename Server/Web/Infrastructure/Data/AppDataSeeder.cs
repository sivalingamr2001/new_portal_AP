using Microsoft.EntityFrameworkCore;
using Web.Domain.Entities;

namespace Web.Infrastructure.Data;

public static class AppDataSeeder
{
    public static async Task SeedIfNeededAsync(
        AppDbContext db,
        IWebHostEnvironment env,
        ILogger? logger = null)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.CmplUsers.AnyAsync() || await db.HodMasters.AnyAsync())
            return;

        var basePath = Path.Combine(env.ContentRootPath, "Shared", "External Sources");
        var userCsv = Path.Combine(basePath, "Userdata_SQL.csv");
        var hodCsv = Path.Combine(basePath, "Hoddata_SQL.csv");

        if (File.Exists(userCsv))
            await SeedCmplUsersAsync(db, userCsv);
        else
            logger?.LogWarning("User CSV not found at {CsvPath}", userCsv);

        if (File.Exists(hodCsv))
            await SeedHodMastersAsync(db, hodCsv);
        else
            logger?.LogWarning("HOD CSV not found at {CsvPath}", hodCsv);

        var deptIds = await db.CmplUsers
            .Where(c => c.DeptId != null && c.DeptId != 0)
            .Select(c => c.DeptId!.Value)
            .Distinct()
            .ToListAsync();

        foreach (var id in deptIds)
        {
            if (await db.Departments.FindAsync(id) != null)
                continue;

            db.Departments.Add(new Department
            {
                DeptId = id,
                DeptName = null,
                HodId = 0
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedCmplUsersAsync(AppDbContext db, string csvPath)
    {
        var lines = await File.ReadAllLinesAsync(csvPath);

        if (lines.Length <= 1)
            return;

        for (var i = 1; i < lines.Length; i++)
        {
            var parts = ParseCsvLine(lines[i]);

            if (parts.Count == 0)
                continue;

            int.TryParse(parts.ElementAtOrDefault(0), out var id);

            if (id == 0)
                continue;

            int? deptId = null;
            if (int.TryParse(parts.ElementAtOrDefault(10), out var parsedDeptId))
                deptId = parsedDeptId;

            db.CmplUsers.Add(new CmplUser
            {
                CmplUserId = id,
                CmplUserName = parts.ElementAtOrDefault(1) ?? string.Empty,
                EmpId = NormalizeValue(parts.ElementAtOrDefault(27)),
                MailId = NormalizeValue(parts.ElementAtOrDefault(9)),
                MobNo = NormalizeValue(parts.ElementAtOrDefault(8)),
                DeptId = deptId
            });

            if (await db.Users.FindAsync(id) != null)
                continue;

            db.Users.Add(new User
            {
                UserId = id,
                Role = "User",
                Location = "Default"
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedHodMastersAsync(AppDbContext db, string csvPath)
    {
        var lines = await File.ReadAllLinesAsync(csvPath);

        if (lines.Length <= 1)
            return;

        for (var i = 1; i < lines.Length; i++)
        {
            var parts = ParseCsvLine(lines[i]);

            if (parts.Count == 0)
                continue;

            int.TryParse(parts.ElementAtOrDefault(8), out var idRow);

            if (idRow == 0)
                continue;

            db.HodMasters.Add(new HodMaster
            {
                IdRow = idRow,
                HodName = parts.ElementAtOrDefault(0) ?? string.Empty,
                Id = NormalizeValue(parts.ElementAtOrDefault(4)),
                EmailId = NormalizeValue(parts.ElementAtOrDefault(6)),
                MobNo = NormalizeValue(parts.ElementAtOrDefault(7))
            });
        }

        await db.SaveChangesAsync();
    }

    private static string? NormalizeValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Equals("NULL", StringComparison.OrdinalIgnoreCase)
            ? null
            : value.Trim();
    }

    private static List<string?> ParseCsvLine(string line)
    {
        var result = new List<string?>();

        if (string.IsNullOrWhiteSpace(line))
            return result;

        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        foreach (var c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());
        return result;
    }
}
