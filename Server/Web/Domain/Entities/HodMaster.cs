using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

public sealed class HodMaster
{
    [Key]
    [Column("id_row")]
    public int UserId { get; set; }

    [Column("hodname")]
    public string? Name { get; set; }

    [Column("id")]
    public string? EmployeeId { get; set; }

    [Column("Email_ID")]
    public string? Email { get; set; }

    [Column("Mob_no")]
    public string? MobileNumber { get; set; }

    [Column("deleted")]
    public uint Deleted { get; set; } = 0;
}
