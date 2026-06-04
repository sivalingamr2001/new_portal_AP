using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

public sealed class CmplUser
{
    [Column("CMPL_USER_ID")]
    public int Id { get; set; }

    [Column("CMPL_USER_NAME")]
    public string? Name { get; set; }

    [Column("emp_id")]
    public string? EmployeeId { get; set; }

    [Column("MAIL_ID")]
    public string? Email { get; set; }

    [Column("MOB_NO")]
    public long? MobileNumber { get; set; }

    [Column("DEPT_ID")]
    public int? DepartmentId { get; set; } = 0;
}
