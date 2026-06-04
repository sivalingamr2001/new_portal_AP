using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

[Table("jan_access_approvals")]
public sealed class AccessApprovalEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int AccessApproveId { get; set; }

    [Column("access_request_id")]
    public int AccessReqId { get; set; }

    [Column("access_item_id")]
    public int AccessItemId { get; set; }

    [Column("approver_id")]
    public int ApproverId { get; set; }

    [Column("approval_status")]
    public RequestStatus ApprovalStatus { get; set; }

    [Column("approval_level")]
    [MaxLength(100)]
    public string ApprovalLevel { get; set; } = string.Empty;

    [Column("comments")]
    [MaxLength(2000)]
    public string Comments { get; set; } = string.Empty;
}
