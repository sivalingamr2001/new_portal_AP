using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

public sealed class CmplUser
{
    [Column("CMPL_USER_ID")]
    public int Id { get; set; }

    [Column("CMPL_USER_NAME")]
    public string Name { get; set; } = string.Empty;

    [Column("emp_id")]
    public string? EmployeeId { get; set; }

    [Column("MAIL_ID")]
    public string? Email { get; set; }

    [Column("MOB_NO")]
    public string? MobileNumber { get; set; }

    [Column("DEPT_ID")]
    public int? DepartmentId { get; set; } = 0;
}
