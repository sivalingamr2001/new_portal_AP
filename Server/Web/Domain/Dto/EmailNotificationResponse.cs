namespace Web.Shared.Utilites.EmailService;

public sealed class EmailNotificationRequest
{
    public string MailFrom { get; set; } = string.Empty;
    public string MailTo { get; set; } = string.Empty;
    public string? MailCc { get; set; }
    public string MailSubject { get; set; } = string.Empty;
    public string MailBody { get; set; } = string.Empty;
    public string MailProgram { get; set; } = string.Empty;
}

public class EmailNotificationResponse
{
    public int MailNo { get; set; }
    public bool IsSuccessful { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class EmailNotificationLog
{
    public int MailNo { get; set; }
    public DateTime SentDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}
