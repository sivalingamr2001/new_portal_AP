using System.Net;
using Web.Domain.Entities;

namespace Web.Shared.Utilites.EmailService;

public static class EmailTemplateUtility
{
    /// <summary>
    /// Generates a standardized HTML email body for access request notifications.
    /// </summary>
    public static string BuildAccessRequestEmailBody(AccessRequestEmailNotification notification)
    {
        ArgumentNullException.ThrowIfNull(notification);

        var requesterName = BuildDisplayName(notification.Requester);

        var recipients = (notification.Recipients ?? [])
            .Where(r => r is not null)
            .DistinctBy(employee => employee.Id)
            .Select(BuildRecipientLabel)
            .ToArray();

        var itemSection = BuildItemSection(notification.Item);
        var expirationSection = BuildExpirationSection(notification.ExpirationDateUtc);
        var commentsSection = BuildCommentsSection(notification.Comments);

        return $@"
            <!DOCTYPE html>
                <html lang=""en"">
                <head>
                    <meta charset=""UTF-8"">
                    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                    <title>Access Request Notification</title>
                </head>
                <body style=""margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #333333;"">

                    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #f4f5f7; padding: 40px 20px;"">
                        <tr>
                            <td align=""center"">
                
                                <!-- Main Container Card -->
                                <table role=""presentation"" width=""100%"" max-width=""600"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e1e4e8;"">
                    
                                    <!-- Header Accent Bar -->
                                    <tr>
                                        <td height=""4"" style=""background-color: #0052cc; line-height: 4px; font-size: 4px;"">&nbsp;</td>
                                    </tr>

                                    <!-- Content Body -->
                                    <tr>
                                        <td style=""padding: 32px 32px 24px 32px;"">
                            
                                            <!-- Heading -->
                                            <h2 style=""margin: 0 0 12px 0; color: #172b4d; font-size: 20px; font-weight: 600; line-height: 1.3;"">
                                                {Html(notification.Heading)}
                                            </h2>
                            
                                            <!-- Summary / Description -->
                                            <p style=""margin: 0 0 24px 0; color: #4a5568; font-size: 15px; line-height: 1.6;"">
                                                {Html(notification.Summary)}
                                            </p>

                                            <!-- Request Details List -->
                                            <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""margin-bottom: 24px; border-top: 1px solid #edf2f7;"">
                                
                                                <!-- Request ID -->
                                                <tr>
                                                    <td width=""30%"" style=""padding: 12px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">Request ID</td>
                                                    <td style=""padding: 12px 0 12px 12px; color: #172b4d; font-size: 14px; font-weight: 500; border-bottom: 1px solid #edf2f7; vertical-align: top;"">#{notification?.Item?.TicketNumber}</td>
                                                </tr>
                                
                                                <!-- Requester -->
                                                <tr>
                                                    <td style=""padding: 12px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">Requester</td>
                                                    <td style=""padding: 12px 0 12px 12px; color: #172b4d; font-size: 14px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">
                                                        <span style=""font-weight: 500;"">{Html(requesterName)}</span> 
                                                        <span style=""color: #718096; font-size: 13px; block-size: auto;"">({Html(notification.Requester?.Email ?? string.Empty)})</span>
                                                    </td>
                                                </tr>
                                
                                                <!-- User ID -->
                                                <tr>
                                                    <td style=""padding: 12px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">User ID</td>
                                                    <td style=""padding: 12px 0 12px 12px; color: #172b4d; font-size: 14px; font-family: monospace; background-color: #f7fafc; border-bottom: 1px solid #edf2f7; vertical-align: top;"">{notification.Requester?.Id}</td>
                                                </tr>
                                
                                                <!-- ITSR Number -->
                                                <tr>
                                                    <td style=""padding: 12px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">ITSR Number</td>
                                                    <td style=""padding: 12px 0 12px 12px; color: #172b4d; font-size: 14px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">{Html(notification.Request?.ItsrNo ?? string.Empty)}</td>
                                                </tr>
                                
                                                <!-- Recipients -->
                                                <tr>
                                                    <td style=""padding: 12px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">Recipients</td>
                                                    <td style=""padding: 12px 0 12px 12px; color: #172b4d; font-size: 14px; border-bottom: 1px solid #edf2f7; vertical-align: top;"">{Html(string.Join("", "", recipients))}</td>
                                                </tr>
                                            </table>

                                            <!-- Dynamic Comments Section -->
                                            {commentsSection}

                                        </td>
                                    </tr>

                                    <!-- Footer Sign-off -->
                                    <tr>
                                        <td style=""padding: 0 32px 32px 32px; background-color: #ffffff;"">
                                            <p style=""margin: 0; color: #718096; font-size: 13px; line-height: 1.5;"">
                                                Regards,<br>
                                                <strong style=""color: #4a5568;"">Access Management System</strong>
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- System Meta Footer -->
                                <table role=""presentation"" width=""100%"" max-width=""600"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""max-width: 600px; width: 100%; margin-top: 16px;"">
                                    <tr>
                                        <td align=""center"" style=""color: #a0aec0; font-size: 11px; text-align: center;"">
                                            This is an automated notification. Please do not reply directly to this email.
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                </body>
                </html>
                ";
    }

    private static string BuildItemSection(AccessItemEntity? item)
    {
        if (item is null) return string.Empty;

        // Call .ToString() on the enums safely to display their text value
        return $@"
            <tr>
                <td><strong>Access Item ID</strong></td>
                <td>{item.AccessItemId}</td>
            </tr>
            <tr>
                <td><strong>Folder Path</strong></td>
                <td>{Html(item.FolderPath ?? string.Empty)}</td>
            </tr>
            <tr>
                <td><strong>Access Type</strong></td>
                <td>{Html(item.AccessType.ToString())}</td>
            </tr>
            <tr>
                <td><strong>Status</strong></td>
                <td>{Html(item.Status.ToString())}</td>
            </tr>";
    }

    private static string BuildExpirationSection(DateTime? expirationDateUtc)
    {
        if (expirationDateUtc is null) return string.Empty;

        return $@"
            <tr>
                <td><strong>Expiration Date</strong></td>
                <td>{expirationDateUtc.Value:dd-MMM-yyyy HH:mm:ss} UTC</td>
            </tr>";
    }

    private static string BuildCommentsSection(string? comments)
    {
        // Fixed the typo method here to use native .IsNullOrWhiteSpace
        if (string.IsNullOrWhiteSpace(comments)) return string.Empty;

        return $@"<p style='margin-top: 15px;'><strong>Comments:</strong> {Html(comments)}</p>";
    }

    private static string BuildDisplayName(CmplUser? employee)
    {
        if (employee is null) return "Unknown User";
        return string.IsNullOrWhiteSpace(employee.Name) ? $"User {employee.Id}" : employee.Name.Trim();
    }

    private static string BuildRecipientLabel(CmplUser employee)
    {
        var role = employee.Email is null ? "User" : "User";
        return $"{BuildDisplayName(employee)} ({role})";
    }

    private static string Html(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}
