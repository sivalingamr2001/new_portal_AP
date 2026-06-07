using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_department")]
public class DepartmentEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("id")]
    public int DepartmentId { get; set; }

    [Column("dept_name")]
    [StringLength(150)]
    public string? DepartmentName { get; set; } = string.Empty;

    [Column("hod_id")]
    public int? HodId { get; set; }
}
