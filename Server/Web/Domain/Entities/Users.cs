using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_portal_users")]
public sealed class User : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Column("role")]
    [MaxLength(100)]
    public string Role { get; set; } = string.Empty;

    [Column("location")]
    [MaxLength(255)]
    public string Location { get; set; } = string.Empty;
}
