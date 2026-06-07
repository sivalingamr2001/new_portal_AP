using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

public class BaseEntity
{
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_on")]
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public int CreatedBy { get; set; }

    [Column("modified_on")]
    public DateTime? ModifiedOn { get; set; }

    [Column("modified_by")]
    public int? ModifiedBy { get; set; }
}
