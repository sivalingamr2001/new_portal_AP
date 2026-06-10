using Dapper;
using Microsoft.EntityFrameworkCore;
using Server.Infrastructure.Oracle;
using Web.Infrastructure.Data;

namespace Web.Shared.Utilites.EmailService;

public interface IEmailService
{
    Task<EmailNotificationResponse> SendEmailAsync(EmailNotificationRequest request, CancellationToken cancellationToken = default);
    Task<EmailNotificationResponse> SendEmailAsync(
        string mailFrom,
        string mailTo,
        string mailSubject,
        string mailBody,
        string mailProgram,
        string? mailCc = null,
        CancellationToken cancellationToken = default);
}

public class EmailService : IEmailService
{
    private readonly AppDbContext _db;
    private readonly IOracleService? _oracleService;
    private readonly ILogger<EmailService> _logger;
    private const string MailTableName = "jan_mail_system";

    public EmailService(AppDbContext db, IOracleService? oracleService, ILogger<EmailService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _oracleService = oracleService;
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<EmailNotificationResponse> SendEmailAsync(EmailNotificationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        return await SendEmailAsync(request.MailFrom, request.MailTo, request.MailSubject, request.MailBody, request.MailProgram, request.MailCc, cancellationToken);
    }

    public async Task<EmailNotificationResponse> SendEmailAsync(
        string mailFrom,
        string mailTo,
        string mailSubject,
        string mailBody,
        string mailProgram,
        string? mailCc = null,
        CancellationToken cancellationToken = default)
    {
        ValidateEmailParameters(mailFrom, mailTo, mailSubject, mailBody, mailProgram);

        var response = new EmailNotificationResponse();

        try
        {
            var mailNo = await InsertMailRecordAsync(mailFrom, mailTo, mailSubject, mailBody, mailProgram, mailCc, cancellationToken);
            response.MailNo = (int)mailNo;
            response.IsSuccessful = true;
            response.Message = $"Email record logged to {MailTableName}. Mail No: {mailNo}.";
            _logger.LogInformation("Email record saved. MailNo: {MailNo}, To: {MailTo}, Program: {Program}", mailNo, mailTo, mailProgram);
        }
        catch (Exception ex)
        {
            response.IsSuccessful = false;
            response.Message = $"Error logging email to database: {ex.Message}";
            _logger.LogError(ex, "Error logging email record to database for {MailTo}", mailTo);
        }

        return response;
    }

    private async Task<long> InsertMailRecordAsync(string mailFrom, string mailTo, string mailSubject, string mailBody, string mailProgram, string? mailCc = null, CancellationToken cancellationToken = default)
    {
        if (_db.Database.IsSqlite())
        {
            return await InsertMySqlMailRecordAsync(mailFrom, mailTo, mailSubject, mailBody, mailProgram, mailCc, cancellationToken);
        }

        if (_db.Database.IsMySql())
        {
            return await InsertMySqlMailRecordAsync(mailFrom, mailTo, mailSubject, mailBody, mailProgram, mailCc, cancellationToken);
        }

        if (_oracleService is null)
        {
            throw new InvalidOperationException("No supported email queue provider is available.");
        }

        return await InsertOracleMailRecordAsync(mailFrom, mailTo, mailSubject, mailBody, mailProgram, mailCc, cancellationToken);
    }

    private async Task<long> InsertSqliteMailRecordAsync(string mailFrom, string mailTo, string mailSubject, string mailBody, string mailProgram, string? mailCc, CancellationToken cancellationToken)
    {
        await _db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS {MailTableName} (
                mail_no INTEGER PRIMARY KEY AUTOINCREMENT,
                mail_date TEXT NOT NULL,
                mail_program TEXT NOT NULL,
                mail_from TEXT NOT NULL,
                mail_to TEXT NOT NULL,
                mail_subject TEXT NOT NULL,
                mail_sent INTEGER NOT NULL DEFAULT 0,
                mail_body TEXT NOT NULL,
                mail_cc TEXT NOT NULL DEFAULT '')", cancellationToken);

        const string insertSql = @"
            INSERT INTO jan_mail_system (mail_date, mail_program, mail_from, mail_to, mail_subject, mail_sent, mail_body, mail_cc)
            VALUES (:MailDate, :MailProgram, :MailFrom, :MailTo, :MailSubject, :MailSent, :MailBody, :MailCc)";

        await using var connection = _db.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var parameters = new DynamicParameters();
        parameters.Add("MailDate", DateTime.UtcNow);
        parameters.Add("MailProgram", mailProgram);
        parameters.Add("MailFrom", mailFrom);
        parameters.Add("MailTo", mailTo);
        parameters.Add("MailSubject", mailSubject);
        parameters.Add("MailSent", 0);
        parameters.Add("MailBody", mailBody);
        parameters.Add("MailCc", mailCc ?? string.Empty);

        await connection.ExecuteAsync(insertSql, parameters);
        return await connection.ExecuteScalarAsync<long>("SELECT last_insert_rowid();");
    }

    private async Task<long> InsertMySqlMailRecordAsync(string mailFrom, string mailTo, string mailSubject, string mailBody, string mailProgram, string? mailCc, CancellationToken cancellationToken)
    {
        await _db.Database.ExecuteSqlRawAsync($@"
            CREATE TABLE IF NOT EXISTS {MailTableName} (
                mail_no BIGINT NOT NULL AUTO_INCREMENT,
                mail_date DATETIME NOT NULL,
                mail_program VARCHAR(255) NOT NULL,
                mail_from VARCHAR(255) NOT NULL,
                mail_to TEXT NOT NULL,
                mail_subject TEXT NOT NULL,
                mail_sent TINYINT NOT NULL DEFAULT 0,
                mail_body LONGTEXT NOT NULL,
                mail_cc TEXT NULL,
                PRIMARY KEY (mail_no))", cancellationToken);

        const string insertSql = @"
            INSERT INTO jan_mail_system (mail_date, mail_program, mail_from, mail_to, mail_subject, mail_sent, mail_body, mail_cc)
            VALUES (:MailDate, :MailProgram, :MailFrom, :MailTo, :MailSubject, :MailSent, :MailBody, :MailCc)";

        await using var connection = _db.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        var parameters = new DynamicParameters();
        parameters.Add("MailDate", DateTime.UtcNow);
        parameters.Add("MailProgram", mailProgram);
        parameters.Add("MailFrom", mailFrom);
        parameters.Add("MailTo", mailTo);
        parameters.Add("MailSubject", mailSubject);
        parameters.Add("MailSent", 0);
        parameters.Add("MailBody", mailBody);
        parameters.Add("MailCc", mailCc ?? string.Empty);

        await connection.ExecuteAsync(insertSql, parameters);
        return await connection.ExecuteScalarAsync<long>("SELECT LAST_INSERT_ID();");
    }

    private async Task<long> InsertOracleMailRecordAsync(string mailFrom, string mailTo, string mailSubject, string mailBody, string mailProgram, string? mailCc, CancellationToken cancellationToken)
    {
        const string insertSql = @"
            INSERT INTO jan_mail_system (mail_no, mail_date, mail_program, mail_from, mail_to, mail_subject, mail_sent, mail_body, mail_cc)
            VALUES (jan_test_seq.nextval, :MailDate, :MailProgram, :MailFrom, :MailTo, :MailSubject, :MailSent, :MailBody, :MailCc)
            RETURNING mail_no INTO :newId";

        var parameters = new DynamicParameters();
        parameters.Add("MailDate", DateTime.UtcNow);
        parameters.Add("MailProgram", mailProgram);
        parameters.Add("MailFrom", mailFrom);
        parameters.Add("MailTo", mailTo);
        parameters.Add("MailSubject", mailSubject);
        parameters.Add("MailSent", 0);
        parameters.Add("MailBody", mailBody);
        parameters.Add("MailCc", mailCc ?? string.Empty);
        parameters.Add("newId", dbType: System.Data.DbType.Decimal, direction: System.Data.ParameterDirection.Output, size: 38);

        await _oracleService!.ExecuteAsync(insertSql, parameters, cancellationToken);
        return Convert.ToInt64(parameters.Get<decimal>("newId"));
    }

    private static void ValidateEmailParameters(string mailFrom, string mailTo, string mailSubject, string mailBody, string mailProgram)
    {
        if (string.IsNullOrWhiteSpace(mailFrom))
            throw new ArgumentException("Mail From cannot be null or empty.", nameof(mailFrom));

        if (string.IsNullOrWhiteSpace(mailTo))
            throw new ArgumentException("Mail To cannot be null or empty.", nameof(mailTo));

        if (string.IsNullOrWhiteSpace(mailSubject))
            throw new ArgumentException("Mail Subject cannot be null or empty.", nameof(mailSubject));

        if (string.IsNullOrWhiteSpace(mailBody))
            throw new ArgumentException("Mail Body cannot be null or empty.", nameof(mailBody));

        if (string.IsNullOrWhiteSpace(mailProgram))
            throw new ArgumentException("Mail Program cannot be null or empty.", nameof(mailProgram));
    }
}
