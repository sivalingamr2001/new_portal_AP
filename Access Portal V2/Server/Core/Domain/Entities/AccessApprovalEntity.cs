using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Server.Core.Domain.Enums;

namespace Server.Core.Domain.Entities;

[Table("jan_accessapproval")]
public class AccessApprovalEntity : BaseEntity
{
    [Key]
    [Column("accessapprove_id")]
    public int AccessApproveId { get; set; }

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("accessitem_id")]
    public int AccessItemId { get; set; }

    [Column("approver_id")]
    public int ApproverId { get; set; }

    [Column("approval_status")]
    public RequestStatus ApprovalStatus { get; set; }

    [Column("comments")]
    [StringLength(500)]
    public string Comments { get; set; } = string.Empty;

    // Relationship Links
    [ForeignKey(nameof(AccessReqId))]
    public virtual AccessRequestEntity AccessRequest { get; set; } = null!;

    [ForeignKey(nameof(AccessItemId))]
    public virtual AccessItemEntity AccessItem { get; set; } = null!;

    [ForeignKey(nameof(ApproverId))]
    public virtual UserAccount Approver { get; set; } = null!;
}
