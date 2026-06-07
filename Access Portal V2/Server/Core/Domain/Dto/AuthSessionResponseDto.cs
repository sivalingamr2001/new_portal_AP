namespace Server.Core.Domain.Dto;

/// <summary>
/// Unified session transfer model returned to the presentation layer.
/// </summary>
public sealed class AuthSessionResponseDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserKey { get; set; }
    public long? MobileNo { get; set; }
    public string? MailId { get; set; }
    public int? DeptId { get; set; }
    public string? EmpId { get; set; }
    public string UserRole { get; set; } = "User";
    public string? Location { get; set; }
    public DateTime AuthenticatedAtUtc { get; set; } = DateTime.UtcNow;
}
