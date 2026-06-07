namespace Server.Core.Domain.Dto;

/// <summary>
/// Unified Data Transfer Object merging Connection 1 details with Connection 2 attributes.
/// </summary>
public sealed class UserProfileResponseDto
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
    public bool IsActive { get; set; }

    public DepartmentDetailResponse? Department { get; set; }
}
