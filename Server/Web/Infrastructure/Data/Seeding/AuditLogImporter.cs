using System.Text;
using MySqlConnector;

namespace Web.Infrastructure.Data.Seeding;

public class AuditLogImporter
{
    private readonly string _connectionString;
    // 2,000 rows per SQL statement keeps us well below MySQL's max parameter limits
    private const int BatchSize = 2000;

    public AuditLogImporter(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task ImportCsvAsync(string csvFilePath)
    {
        using var reader = new StreamReader(csvFilePath);

        // Skip CSV Header line
        await reader.ReadLineAsync();

        var rowsBatch = new List<string[]>();
        long totalProcessed = 0;
        string? line;

        while ((line = await reader.ReadLineAsync()) != null)
        {
            var parts = line.Split(',');
            if (parts.Length < 9) continue;

            rowsBatch.Add(parts);
            totalProcessed++;

            if (rowsBatch.Count >= BatchSize)
            {
                Console.WriteLine($"Inserting batch... (Total records read: {totalProcessed:N0})");
                await ExecuteMultiRowInsertAsync(rowsBatch);
                rowsBatch.Clear();
            }
        }

        // Insert any remaining rows
        if (rowsBatch.Count > 0)
        {
            Console.WriteLine($"Inserting final batch... (Total records read: {totalProcessed:N0})");
            await ExecuteMultiRowInsertAsync(rowsBatch);
        }
    }

    private async Task ExecuteMultiRowInsertAsync(List<string[]> rows)
    {
        using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();

        // Build a single command with multiple values: INSERT INTO table VALUES (...), (...), (...)
        var sqlBuilder = new StringBuilder();
        sqlBuilder.Append("INSERT INTO jan_ntfs_permissions_audit (auditid, scandate, folderpath, assignedidentity, identitytype, accesscontroltype, filesystemrights, resolveduser, groupname) VALUES ");

        using var cmd = new MySqlCommand { Connection = connection };

        for (int i = 0; i < rows.Count; i++)
        {
            var parts = rows[i];

            // Define unique parameter tokens for this row block
            string pId = $"@id{i}";
            string pDate = $"@dt{i}";
            string pPath = $"@pt{i}";
            string pIdent = $"@in{i}";
            string pType = $"@tp{i}";
            string pAct = $"@ac{i}";
            string pRight = $"@rt{i}";
            string pUser = $"@us{i}";
            string pGroup = $"@gp{i}";

            sqlBuilder.Append($"({pId}, {pDate}, {pPath}, {pIdent}, {pType}, {pAct}, {pRight}, {pUser}, {pGroup})");

            if (i < rows.Count - 1)
                sqlBuilder.Append(", ");

            // Assign values to parameters cleanly to prevent SQL injection or formatting bugs
            cmd.Parameters.AddWithValue(pId, long.Parse(parts[0]));
            cmd.Parameters.AddWithValue(pDate, DateTime.Parse(parts[1]));
            cmd.Parameters.AddWithValue(pPath, parts[2]);
            cmd.Parameters.AddWithValue(pIdent, parts[3]);
            cmd.Parameters.AddWithValue(pType, parts[4]);
            cmd.Parameters.AddWithValue(pAct, parts[5]);
            cmd.Parameters.AddWithValue(pRight, parts[6]);
            cmd.Parameters.AddWithValue(pUser, parts[7]);
            cmd.Parameters.AddWithValue(pGroup, parts[8]);
        }

        cmd.CommandText = sqlBuilder.ToString();
        await cmd.ExecuteNonQueryAsync();
    }
}
