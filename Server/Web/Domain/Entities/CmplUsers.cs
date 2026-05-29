namespace Web.Domain.Entities;

public sealed class CmplUser
{
    public int CmplUserId { get; set; }
    public string CmplUserName { get; set; } = string.Empty;
    public string? EmpId { get; set; }
    public string? MailId { get; set; }
    public string? MobNo { get; set; }
    public int? DeptId { get; set; } = 0;
}

