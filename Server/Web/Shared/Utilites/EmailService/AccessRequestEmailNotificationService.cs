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
                MailBody = EmailTemplateUtility.BuildAccessRequestEmailBody(notification),
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
