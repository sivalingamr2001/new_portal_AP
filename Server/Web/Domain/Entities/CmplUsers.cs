using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

public sealed class CmplUser
{
    [Column("CmplUserId")]
    public int Id { get; set; }

    [Column("CmplUserName")]
    public string Name { get; set; } = string.Empty;

    [Column("EmpId")]
    public string? EmployeeId { get; set; }

    [Column("MailId")]
    public string? Email { get; set; }

    [Column("MobNo")]
    public string? MobileNumber { get; set; }

    [Column("DeptId")]
    public int? DepartmentId { get; set; } = 0;
}
