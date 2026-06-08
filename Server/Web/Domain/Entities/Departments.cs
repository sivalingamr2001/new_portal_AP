using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Web.Domain.Common;

namespace Web.Domain.Entities;

[Table("jan_departments")]
public sealed class Department : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Column("dept_name")]
    [MaxLength(255)]
    public string? Name { get; set; } = string.Empty;

    [Column("hod_id")]
    [MaxLength(255)]
    public string? HodId { get; set; } = string.Empty;

    [Column("email_id")]
    [MaxLength(255)]
    public string? Email { get; set; } = string.Empty;
}
