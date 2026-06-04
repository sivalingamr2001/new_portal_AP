namespace Web.Domain.Dto;

public class EmailNotificationRequest
{
    public required string MailFrom { get; set; }
    public required string MailTo { get; set; }
    public string? MailCc { get; set; }
    public required string MailSubject { get; set; }
    public required string MailBody { get; set; }
    public required string MailProgram { get; set; } // e.g., "AccessRequest_Approval", "AccessRequest_Rejection"
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
    public string Status { get; set; } = string.Empty; // "Sent", "Failed"
    public string? ErrorMessage { get; set; }
}
