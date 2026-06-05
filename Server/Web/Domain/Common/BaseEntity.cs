namespace Web.Domain.Common;

public class BaseEntity
{
    public bool IsActive { get; set; } = true;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public DateTime? ModifiedOn { get; set; }

    public int CreatedBy { get; set; }

    public int? ModifiedBy { get; set; }
}
