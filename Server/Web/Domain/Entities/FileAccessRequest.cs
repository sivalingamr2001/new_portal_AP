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

    // Navigation Properties
    public virtual ICollection<AccessItemEntity> AccessItems { get; set; } = new List<AccessItemEntity>();
    public virtual ICollection<AccessApprovalEntity> AccessApprovals { get; set; } = new List<AccessApprovalEntity>();
    public virtual ICollection<AccessReqAuditEntity> AccessAudits { get; set; } = new List<AccessReqAuditEntity>();
}

[Table("jan_access_items")]
public class AccessItemEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int AccessItemId { get; set; }

    [Column("access_request_id")]
    public int AccessReqId { get; set; }

    [Column("ticket_number")]
    [MaxLength(100)]
    public string TicketNumber { get; set; } = string.Empty;

    [Column("status")]
    public RequestStatus Status { get; set; }

    [Column("folder_path")]
    [MaxLength(1000)]
    public string FolderPath { get; set; } = string.Empty;

    [Column("access_type")]
    public AccessTypes AccessType { get; set; }

    [Column("confirm_access_type")]
    public AccessTypes ConfirmAccessType { get; set; }

    [Column("reason")]
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;

    [Column("rejection_reason")]
    [MaxLength(2000)]
    public string? RejectionReason { get; set; }

    [Column("hod_approver_id")]
    public int? HodApproverId { get; set; }

    [Column("it_approver_id")]
    public int? ItApproverId { get; set; }

    [Column("approved_at_utc")]
    public DateTime? ApprovedAtUtc { get; set; }

    [Column("expires_at_utc")]
    public DateTime? ExpiresAtUtc { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(AccessReqId))]
    public virtual AccessRequestEntity AccessRequest { get; set; } = null!;
    public virtual ICollection<AccessApprovalEntity> AccessApprovals { get; set; } = new List<AccessApprovalEntity>();
    public virtual ICollection<AccessReqAuditEntity> AccessAudits { get; set; } = new List<AccessReqAuditEntity>();
}

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

    [ForeignKey(nameof(AccessReqId))]
    public virtual AccessRequestEntity AccessRequest { get; set; } = null!;

    [ForeignKey(nameof(AccessItemId))]
    public virtual AccessItemEntity AccessItem { get; set; } = null!;
}

[Table("jan_access_req_audits")]
public sealed class AccessReqAuditEntity : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int AuditId { get; set; }

    [Column("access_request_id")]
    public int AccessReqId { get; set; }

    [Column("access_item_id")]
    public int? AccessItemId { get; set; }

    [Column("access_approval_id")]
    public int? AccessApproveId { get; set; }

    [Column("event_type")]
    [MaxLength(100)]
    public string EventType { get; set; } = string.Empty;

    [Column("message")]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    [Column("recipient_user_id")]
    public int RecipientUserId { get; set; }

    [Column("recipient_name")]
    [MaxLength(255)]
    public string RecipientName { get; set; } = string.Empty;

    [Column("recipient_role")]
    [MaxLength(100)]
    public string RecipientRole { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("actor_user_id")]
    public int? ActorUserId { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(AccessReqId))]
    public virtual AccessRequestEntity AccessRequest { get; set; } = null!;

    [ForeignKey(nameof(AccessItemId))]
    public virtual AccessItemEntity? AccessItem { get; set; }
}
