using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

[Table("jan_access_requests")]
public class AccessRequestEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int AccessReqId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("req_to")]
    public int ReqTo { get; set; }

    [Column("is_agreed")]
    public bool IsAgreed { get; set; }

    [Column("itsr_no")]
    [MaxLength(100)]
    public string? ItsrNo { get; set; } = string.Empty;

    [Column("current_status")]
    public RequestStatus CurrentStatus { get; set; } = RequestStatus.Submitted;

    [Column("current_approver_id")]
    public int? CurrentApproverId { get; set; }
    public virtual ICollection<AccessItemEntity> AccessItems { get; set; } = new List<AccessItemEntity>();
    public virtual ICollection<AccessApprovalEntity> AccessApprovals { get; set; } = new List<AccessApprovalEntity>();
    public virtual ICollection<AccessReqAuditEntity> AccessAudits { get; set; } = new List<AccessReqAuditEntity>();
}
