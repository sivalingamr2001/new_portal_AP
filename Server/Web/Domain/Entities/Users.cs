using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

[Table("jan_portal_users")]
public sealed class User
{
    [Key]
    [Column("UserId")]
    public int Id { get; set; }

    [Column("Role")]
    public string Role { get; set; } = string.Empty;

    [Column("Location")]
    public string Location { get; set; } = string.Empty;
}
