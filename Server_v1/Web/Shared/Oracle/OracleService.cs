using ConnectionDll;

namespace Web.Shared.Oracle;

/// <summary>
/// Defines database operations for Oracle.
/// </summary>
public interface IOracleService
{
    Task<int> ExecuteAsync(string sql, object? parameters = null, CancellationToken ct = default);
    Task<T?> ExecuteScalarAsync<T>(string sql, object? parameters = null, CancellationToken ct = default);
}

public class OracleService
{
    private readonly ILogger<OracleService> _logger;
    private readonly string _connectionString;

    public OracleService(ILogger<OracleService> logger)
    {
        _logger = logger;

        // 1. Get connection string from DLL
        var provider = new Class1();

        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            _logger.LogCritical("Oracle connection string is missing in ConnectionDll.");
        }
    }

}
