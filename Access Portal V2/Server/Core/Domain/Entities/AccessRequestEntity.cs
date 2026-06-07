using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_accessrequest")]
public class AccessRequestEntity : BaseEntity
{
    [Key]
    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("User_id")]
    public int UserId { get; set; }

    [Column("req_to")]
    public int ReqTo { get; set; }

    [Column("is_agreed")]
    public bool IsAgreed { get; set; }

    [Column("itsr_no")]
    [StringLength(50)]
    public string? ItsrNo { get; set; } = string.Empty;

    // Relationship Links
    [ForeignKey(nameof(UserId))]
    public virtual UserAccount Requester { get; set; } = null!;

    [ForeignKey(nameof(ReqTo))]
    public virtual UserAccount ApproverTarget { get; set; } = null!;

    public virtual ICollection<AccessItemEntity> AccessItems { get; set; } = new List<AccessItemEntity>();
    public virtual ICollection<AccessApprovalEntity> Approvals { get; set; } = new List<AccessApprovalEntity>();
}
