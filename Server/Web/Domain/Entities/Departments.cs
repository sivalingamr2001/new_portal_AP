using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

[Table("jan_departments")]
public sealed class Department
{
    public int DeptId { get; set; }
    public string? DeptName { get; set; } = string.Empty;
    public string? HodId { get; set; } = string.Empty;
}
