using System.Diagnostics;

namespace Web.Infrastructure.Data.Seeding;

public class FolderDataSeeding
{
    // Wrapped execution logic safely inside an asynchronous method
    public static async Task ExecuteImportAsync()
    {
        Console.WriteLine("=== MySQL High-Speed Audit Log Importer ===");

        // 1. Connection String 
        var connectionString = "Server=10.30.50.40;Port=3306;database=jan_itaccessreq_db;user=itaccessreq_usr;password=j2N*tA66e44D6*^E6;AllowLoadLocalInfile=True;";

        // 2. Absolute Path to the source CSV file
        var csvFilePath = @"D:\My Instance\new_portal_AP\Server\Web\Shared\External Sources\ntfs_permissions_audit.csv";

        // Verification check before processing begins
        if (!File.Exists(csvFilePath))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.Error.WriteLine($"[ERROR] Target CSV file could not be found at path:\n{csvFilePath}");
            Console.ResetColor();
            return;
        }

        // 3. Execute the bulk importer execution loop
        Console.WriteLine($"Target File: {Path.GetFileName(csvFilePath)}");
        Console.WriteLine("Streaming records directly to MySQL database...");

        var stopwatch = Stopwatch.StartNew();
        try
        {
            // Note: Ensure your AuditLogImporter class matches this instantiation
            var importer = new AuditLogImporter(connectionString);
            await importer.ImportCsvAsync(csvFilePath);

            stopwatch.Stop();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"\n[SUCCESS] Import completed successfully in {stopwatch.Elapsed.TotalSeconds:F2} seconds!");
            Console.ResetColor();
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"\n[FATAL ERROR] Import failed: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Details: {ex.InnerException.Message}");
            }
            Console.ResetColor();
        }
    }
}
