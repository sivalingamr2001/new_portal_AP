using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

[Table("jan_departments")]
public sealed class Department
{
    [Column("DeptId")]
    public int Id { get; set; }

    [Column("DeptName")]
    public string? Name { get; set; } = string.Empty;

    [Column("HodId")]
    public string? HodId { get; set; } = string.Empty;
}
