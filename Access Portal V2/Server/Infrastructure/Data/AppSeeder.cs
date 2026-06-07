using CsvHelper;
using Microsoft.EntityFrameworkCore;
using Server.Core.Domain.Entities;
using System.Globalization;

namespace Server.Infrastructure.Data;

public static class AppSeeder
{
    public static async Task SeedUsersAsync(
        IdentityDbContext identityDb,
        AppDbContext appDb)
    {
        var csvPath = "/Users/sivalingam/Documents/GitHub/new_portal_AP/Access Portal V2/Server/Shared/External Sources/Userdata_SQL.csv";

        if (!File.Exists(csvPath))
            return;

        using var reader = new StreamReader(csvPath);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

        var records = csv.GetRecords<dynamic>().ToList();

        var users = new List<UserAccount>();

        foreach (var record in records)
        {
            var row = (IDictionary<string, object>)record;

            if (!int.TryParse(row["CMPL_USER_ID"]?.ToString(), out var userId))
                continue;

            users.Add(new UserAccount
            {
                UserId = userId,
                UserName = row["CMPL_USER_NAME"]?.ToString(),
                UserKey = row["CMPL_USER_KEY"]?.ToString(),
                MobileNo = long.TryParse(row["MOB_NO"]?.ToString(), out var mobile)
                    ? mobile
                    : null,
                MailId = row["MAIL_ID"]?.ToString(),
                DeptId = int.TryParse(row["DEPT_ID"]?.ToString(), out var dept)
                    ? dept
                    : null,
                EmpId = row["emp_id"]?.ToString()
            });
        }

        // --------------------------------------------------
        // Demo Users
        // --------------------------------------------------
        var demoUsers = new List<UserAccount>
        {
            new() { UserId = 1, UserName = "Admin", UserKey = "admin", DeptId = 101 },
            new() { UserId = 2, UserName = "IT User", UserKey = "it", DeptId = 101 },
            new() { UserId = 5, UserName = "HOD User", UserKey = "hod", DeptId = 101 },
            new() { UserId = 6, UserName = "Normal User", UserKey = "user", DeptId = 101 }
        };

        foreach (var demoUser in demoUsers)
        {
            if (!users.Any(x => x.UserId == demoUser.UserId))
            {
                users.Add(demoUser);
            }
        }

        // --------------------------------------------------
        // USERS TABLE
        // --------------------------------------------------
        var existingUserIds = await identityDb.Users
            .Select(x => x.UserId)
            .ToListAsync();

        var newUsers = users
            .Where(x => !existingUserIds.Contains(x.UserId))
            .ToList();

        if (newUsers.Any())
        {
            await identityDb.Users.AddRangeAsync(newUsers);

            // NOTE:
            // IdentityDbContext must allow SaveChanges()
            await identityDb.SaveChangesAsync();
        }

        // --------------------------------------------------
        // DEPARTMENTS TABLE
        // --------------------------------------------------
        var csvDepartmentIds = users
            .Where(x => x.DeptId.HasValue && x.DeptId.Value > 0)
            .Select(x => x.DeptId!.Value)
            .Distinct()
            .ToList();

        var existingDepartments = await appDb.Departments
            .Select(x => x.DepartmentId)
            .ToListAsync();

        var newDepartments = csvDepartmentIds
            .Where(id => !existingDepartments.Contains(id))
            .Select(id => new DepartmentEntity
            {
                DepartmentId = id,
                DepartmentName = null!
            })
            .ToList();

        if (newDepartments.Any())
        {
            await appDb.Departments.AddRangeAsync(newDepartments);
        }

        foreach (var id in csvDepartmentIds)
        {
            Console.WriteLine($"Department: {id}");
        }

        // --------------------------------------------------
        // USER DETAILS TABLE
        // --------------------------------------------------
        var existingUserDetails = await appDb.UserDetails
            .Select(x => x.UserId)
            .ToListAsync();

        var userDetails = users
            .Where(x => !existingUserDetails.Contains(x.UserId))
            .Select(x => new UserDetail
            {
                UserId = x.UserId,
                UserRole = x.UserId switch
                {
                    1 => "Admin",
                    2 => "IT",
                    5 => "Hod",
                    6 => "User",
                    _ => "User"
                },
                Location = null
            })
            .ToList();

        if (userDetails.Any())
        {
            await appDb.UserDetails.AddRangeAsync(userDetails);
        }

        await appDb.SaveChangesAsync();
    }
}