using Dapper;
using Oracle.ManagedDataAccess.Client;
using ConnectionDll;
using Microsoft.Extensions.Logging;

namespace Server.Infrastructure.Oracle;

/// <summary>
/// Defines database operations for Oracle.
/// </summary>
public interface IOracleService
{
    Task<int> ExecuteAsync(string sql, object? parameters = null, CancellationToken ct = default);
    Task<T?> ExecuteScalarAsync<T>(string sql, object? parameters = null, CancellationToken ct = default);
}

public class OracleService : IOracleService
{
    private readonly ILogger<OracleService> _logger;
    private readonly string _connectionString;

    public OracleService(ILogger<OracleService> logger)
    {
        _logger = logger;

        // 1. Get connection string from DLL
        var provider = new Class1();
        _connectionString = provider.oracon.ConnectionString;

        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            _logger.LogCritical("Oracle connection string is missing in ConnectionDll.");
        }
    }

    /// <summary>
    /// Creates a new Oracle connection instance.
    /// </summary>
    private OracleConnection CreateConnection()
    {
        return new OracleConnection(_connectionString);
    }

    public async Task<int> ExecuteAsync(string sql, object? parameters = null, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(sql);

        try
        {
            using var connection = CreateConnection();

            // 2. Wrap in CommandDefinition to support CancellationToken
            var command = new CommandDefinition(sql, parameters, cancellationToken: ct);

            return await connection.ExecuteAsync(command);
        }
        catch (OracleException ex)
        {
            _logger.LogError(ex, "Oracle Error {Num}: {Msg}. SQL: {SQL}", ex.Number, ex.Message, sql);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "General error in ExecuteAsync.");
            throw;
        }
    }

    public async Task<T?> ExecuteScalarAsync<T>(string sql, object? parameters = null, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(sql);

        try
        {
            using var connection = CreateConnection();

            // 3. Oracle requires explicit BindByName for Dapper to map objects correctly
            // This prevents ORA-00936 in many cases
            var command = new CommandDefinition(sql, parameters, cancellationToken: ct);

            return await connection.ExecuteScalarAsync<T>(command);
        }
        catch (OracleException ex)
        {
            _logger.LogError(ex, "Oracle Error {Num}: {Msg}. SQL: {SQL}", ex.Number, ex.Message, sql);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "General error in ExecuteScalarAsync.");
            throw;
        }
    }
}
