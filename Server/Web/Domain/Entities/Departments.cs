namespace Web.Domain.Entities;

public sealed class Department
{
    public int DeptId { get; set; }
    public string? DeptName { get; set; } = string.Empty;
    public int? HodId { get; set; } = 0;
}