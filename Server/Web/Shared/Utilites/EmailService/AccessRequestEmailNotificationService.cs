using System.Net;
using Web.Domain.Entities;

namespace Web.Shared.Utilites.EmailService;

public interface IAccessRequestEmailNotificationService
{
    Task SendStageNotificationAsync(AccessRequestEmailNotification notification, CancellationToken cancellationToken);
}

public class AccessRequestEmailNotificationService : IAccessRequestEmailNotificationService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<AccessRequestEmailNotificationService> _logger;
    private const string FromEmail = "feedback@janatics.co.in";
    private const string ProgramName = "AccessRequestApproval";

    public AccessRequestEmailNotificationService(
        IEmailService emailService,
        ILogger<AccessRequestEmailNotificationService> logger)
    {
        _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SendStageNotificationAsync(
        AccessRequestEmailNotification notification,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(notification);

        try
        {
            var recipientEmails = notification.Recipients
                .Select(employee => !string.IsNullOrWhiteSpace(employee.Email)
                    ? employee.Email.Trim()
                    : $"user{employee.Id}@system.local")
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (recipientEmails.Length == 0)
            {
                _logger.LogWarning(
                    "Skipped access request email for Request ID {RequestId} because no recipient email addresses were found.",
                    notification.Request.AccessReqId);
                return;
            }

            var requesterEmail = notification.Requester.Email?.Trim();
            var toRecipients = !string.IsNullOrWhiteSpace(requesterEmail)
                ? new[] { requesterEmail }
                : new[] { recipientEmails[0] };

            var ccRecipients = recipientEmails
                .Except(toRecipients, StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var emailRequest = new EmailNotificationRequest
            {
                MailFrom = FromEmail,
                MailTo = string.Join(",", toRecipients),
                MailCc = ccRecipients.Length == 0 ? string.Empty : string.Join(",", ccRecipients),
                MailSubject = notification.Subject,
                MailBody = BuildEmailBody(notification),
                MailProgram = $"{ProgramName}_{notification.MailProgramSuffix}"
            };

            var response = await _emailService.SendEmailAsync(emailRequest, cancellationToken);

            if (response.IsSuccessful)
            {
                _logger.LogInformation(
                    "Access request email sent. RequestId={RequestId}, ItemId={ItemId}, Program={Program}, To={To}, Cc={Cc}",
                    notification.Request.AccessReqId,
                    notification.Item?.AccessItemId,
                    emailRequest.MailProgram,
                    emailRequest.MailTo,
                    emailRequest.MailCc);
            }
            else
            {
                _logger.LogWarning(
                    "Failed to send access request email. RequestId={RequestId}, Program={Program}, Error={Error}",
                    notification.Request.AccessReqId,
                    emailRequest.MailProgram,
                    response.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error sending access request email. RequestId={RequestId}, ItemId={ItemId}",
                notification.Request.AccessReqId,
                notification.Item?.AccessItemId);
        }
    }

    private static string BuildEmailBody(AccessRequestEmailNotification notification)
    {
        var requesterName = BuildDisplayName(notification.Requester);
        var recipients = notification.Recipients
            .DistinctBy(employee => employee.Id)
            .Select(BuildRecipientLabel)
            .ToArray();

        var itemSection = notification.Item is null
            ? string.Empty
            : $@"
                                            <tr>
                                                <td><strong>Access Item ID</strong></td>
                                                <td>{notification.Item.AccessItemId}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Folder Path</strong></td>
                                                <td>{Html(notification.Item.FolderPath)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Access Type</strong></td>
                                                <td>{notification.Item.AccessType}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Status</strong></td>
                                                <td>{notification.Item.Status}</td>
                                            </tr>";

        var commentsSection = string.IsNullOrWhiteSpace(notification.Comments)
            ? string.Empty
            : $@"
                                        <p><strong>Comments:</strong> {Html(notification.Comments)}</p>";

        var expirationSection = notification.ExpirationDateUtc is null
            ? string.Empty
            : $@"
                                            <tr>
                                                <td><strong>Expiration Date</strong></td>
                                                <td>{notification.ExpirationDateUtc.Value:dd-MMM-yyyy HH:mm:ss} UTC</td>
                                            </tr>";

        return $@"
                                    <!DOCTYPE html>
                                    <html>
                                    <body style='font-family: Arial, sans-serif; color: #222;'>
                                        <h3>{Html(notification.Heading)}</h3>
                                        <p>{Html(notification.Summary)}</p>

                                        <table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse;'>
                                            <tr>
                                                <td><strong>Request ID</strong></td>
                                                <td>#{notification.Request.AccessReqId}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Requester</strong></td>
                                                <td>{Html(requesterName)} ({Html(notification.Requester.Email ?? string.Empty)})</td>
                                            </tr>
                                            <tr>
                                                <td><strong>User ID</strong></td>
                                                <td>{notification.Requester.Id}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>ITSR Number</strong></td>
                                                <td>{Html(notification.Request.ItsrNo ?? string.Empty)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Recipients</strong></td>
                                                <td>{Html(string.Join(", ", recipients))}</td>
                                            </tr>{itemSection}{expirationSection}
                                        </table>{commentsSection}

                                        <p>Regards,<br>Access Management System</p>
                                    </body>
                                    </html>";
    }

    private static string BuildDisplayName(CmplUser employee)
    {
        return string.IsNullOrWhiteSpace(employee.Name) ? $"User {employee.Id}" : employee.Name.Trim();
    }

    private static string BuildRecipientLabel(CmplUser employee)
    {
        var role = employee.Email is null ? "User" : "User";
        return $"{BuildDisplayName(employee)} ({role})";
    }

    private static string Html(string value) => WebUtility.HtmlEncode(value);
}
