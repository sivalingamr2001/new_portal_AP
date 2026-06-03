using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

public sealed class HodMaster
{
    [Key]
    [Column("IdRow")]
    public int UserId { get; set; }

    [Column("HodName")]
    public string Name { get; set; } = string.Empty;

    [Column("Id")]
    public string? EmployeeId { get; set; }

    [Column("EmailId")]
    public string? Email { get; set; }

    [Column("MobNo")]
    public string? MobileNumber { get; set; }
}
