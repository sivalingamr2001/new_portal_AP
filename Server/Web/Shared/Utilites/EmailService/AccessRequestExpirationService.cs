using System.Net;
using Web.Domain.Entities;
using Web.Shared.Utilites.EmailService;

namespace Web.Shared.Utilites.EmailService;

public interface IAccessRequestExpirationService
{
    Task SendExpiringSoonEmailAsync(
        AccessRequestEntity request,
        AccessItemEntity item,
        CmplUser requester,
        IReadOnlyCollection<CmplUser> recipients,
        DateTime expirationDateUtc,
        CancellationToken cancellationToken);

    Task SendExpiredEmailAsync(
        AccessRequestEntity request,
        AccessItemEntity item,
        CmplUser requester,
        IReadOnlyCollection<CmplUser> recipients,
        DateTime expirationDateUtc,
        CancellationToken cancellationToken);
}

public class AccessRequestExpirationService : IAccessRequestExpirationService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<AccessRequestExpirationService> _logger;
    private const string FromEmail = "feedback@janatics.co.in";
    private const string MailProgram = "AccessRequestExpiration";

    public AccessRequestExpirationService(
        IEmailService emailService,
        ILogger<AccessRequestExpirationService> logger)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SendExpiringSoonEmailAsync(
        AccessRequestEntity request,
        AccessItemEntity item,
        CmplUser requester,
        IReadOnlyCollection<CmplUser> recipients,
        DateTime expirationDateUtc,
        CancellationToken cancellationToken)
    {
        var subject = $"Access Request #{request.AccessReqId} - Item #{item.AccessItemId} Expiring Soon";
        var summary = $"Access for item #{item.AccessItemId} will expire on {expirationDateUtc:dd-MMM-yyyy}.";

        await SendExpirationEmailAsync(
            request,
            item,
            requester,
            recipients,
            subject,
            "Access expiring soon",
            summary,
            expirationDateUtc,
            "ExpiringSoon",
            cancellationToken);
    }

    public async Task SendExpiredEmailAsync(
        AccessRequestEntity request,
        AccessItemEntity item,
        CmplUser requester,
        IReadOnlyCollection<CmplUser> recipients,
        DateTime expirationDateUtc,
        CancellationToken cancellationToken)
    {
        var subject = $"Access Request #{request.AccessReqId} - Item #{item.AccessItemId} Expired";
        var summary = $"Access for item #{item.AccessItemId} expired on {expirationDateUtc:dd-MMM-yyyy}.";

        await SendExpirationEmailAsync(
            request,
            item,
            requester,
            recipients,
            subject,
            "Access expired",
            summary,
            expirationDateUtc,
            "Expired",
            cancellationToken);
    }

    private async Task SendExpirationEmailAsync(
        AccessRequestEntity request,
        AccessItemEntity item,
        CmplUser requester,
        IReadOnlyCollection<CmplUser> recipients,
        string subject,
        string heading,
        string summary,
        DateTime expirationDateUtc,
        string mailProgramSuffix,
        CancellationToken cancellationToken)
    {
        try
        {
            // Recipients don't have email in EmployeeEntity; use UserName as fallback
            var recipientEmails = recipients
                .Select(employee => !string.IsNullOrWhiteSpace(employee.Email)
                    ? employee.Email.Trim()
                    : $"user{employee.Id}@system.local")
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (recipientEmails.Length == 0)
            {
                _logger.LogWarning(
                    "Skipped expiration email for RequestId={RequestId}, ItemId={ItemId} because no email addresses were found.",
                    request.AccessReqId,
                    item.AccessItemId);
                return;
            }

            var toAddress = !string.IsNullOrWhiteSpace(requester.Email)
                ? requester.Email.Trim()
                : recipientEmails[0];

            var ccAddresses = recipientEmails
                .Where(email => !string.Equals(email, toAddress, StringComparison.OrdinalIgnoreCase))
                .ToArray();

            var emailRequest = new EmailNotificationRequest
            {
                MailFrom = FromEmail,
                MailTo = toAddress,
                MailCc = ccAddresses.Length == 0 ? string.Empty : string.Join(",", ccAddresses),
                MailSubject = subject,
                MailBody = BuildEmailBody(request, item, requester, recipients, heading, summary, expirationDateUtc),
                MailProgram = $"{MailProgram}_{mailProgramSuffix}"
            };

            var response = await _emailService.SendEmailAsync(emailRequest, cancellationToken);

            if (response.IsSuccessful)
            {
                _logger.LogInformation(
                    "Expiration email queued successfully. RequestId={RequestId}, ItemId={ItemId}, Program={Program}",
                    request.AccessReqId,
                    item.AccessItemId,
                    emailRequest.MailProgram);
            }
            else
            {
                _logger.LogWarning(
                    "Failed to queue expiration email. RequestId={RequestId}, ItemId={ItemId}, Error={Error}",
                    request.AccessReqId,
                    item.AccessItemId,
                    response.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error sending expiration email. RequestId={RequestId}, ItemId={ItemId}",
                request.AccessReqId,
                item.AccessItemId);
        }
    }

    private static string BuildEmailBody(
        AccessRequestEntity request,
        AccessItemEntity item,
        CmplUser requester,
        IReadOnlyCollection<CmplUser> recipients,
        string heading,
        string summary,
        DateTime expirationDateUtc)
    {
        var requesterName = BuildDisplayName(requester);
        var recipientSummary = string.Join(", ", recipients
            .DistinctBy(employee => employee.Id)
            .Select(employee => $"{BuildDisplayName(employee)} ({NormalizeRole(employee.Email)})"));

        return $@"
<!DOCTYPE html>
<html>
<body style='font-family: Arial, sans-serif; color: #222;'>
    <h3>{Html(heading)}</h3>
    <p>{Html(summary)}</p>

    <table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse;'>
        <tr>
            <td><strong>Request ID</strong></td>
            <td>#{request.AccessReqId}</td>
        </tr>
        <tr>
            <td><strong>Access Item ID</strong></td>
            <td>{item.AccessItemId}</td>
        </tr>
        <tr>
            <td><strong>Requester</strong></td>
            <td>{Html(requesterName)} ({Html(requester.Email)})</td>
        </tr>
        <tr>
            <td><strong>Folder Path</strong></td>
            <td>{Html(item.FolderPath)}</td>
        </tr>
        <tr>
            <td><strong>Access Type</strong></td>
            <td>{item.AccessType}</td>
        </tr>
        <tr>
            <td><strong>Current Status</strong></td>
            <td>{item.Status}</td>
        </tr>
        <tr>
            <td><strong>Expiration Date</strong></td>
            <td>{expirationDateUtc:dd-MMM-yyyy HH:mm:ss} UTC</td>
        </tr>
        <tr>
            <td><strong>Recipients</strong></td>
            <td>{Html(recipientSummary)}</td>
        </tr>
    </table>

    <p>Regards,<br>Access Management System</p>
</body>
</html>";
    }

    private static string BuildDisplayName(CmplUser employee)
    {
        return string.IsNullOrWhiteSpace(employee.Name) ? $"User {employee.Id}" : employee.Name.Trim();
    }

    private static string NormalizeRole(string? role) =>
        string.IsNullOrWhiteSpace(role) ? "User" : role;

    private static string Html(string value) => WebUtility.HtmlEncode(value);
}
