using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

[Table("jan_accessrequest")]
public class AccessRequestEntity
{
    [Key]
    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("User_id")]
    public int UserId { get; set; }

    [Column("req_to")]
    public int ReqTo { get; set; } //Ref UserId

    [Column("is_agreed")]
    public bool IsAgreed { get; set; }

    [Column("itsr_no")]
    public string? ItsrNo { get; set; } = string.Empty;

    [Column("current_status")]
    public RequestStatus CurrentStatus { get; set; } = RequestStatus.Submitted;

    [Column("current_approver_id")]
    public int? CurrentApproverId { get; set; }

    [Column("requested_at_utc")]
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;

    [Column("last_action_at_utc")]
    public DateTime LastActionAtUtc { get; set; } = DateTime.UtcNow;

    public virtual ICollection<AccessItemEntity> AccessItems { get; set; } = new List<AccessItemEntity>();
}

[Table("jan_accessitems")]
public class AccessItemEntity
{
    [Key]
    [Column("accessitem_id")]
    public int AccessItemId { get; set; }

    [Column("ticket_number")]
    public string TicketNumber { get; set; } = string.Empty;

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("status")]
    public RequestStatus Status { get; set; }

    [Column("folder_path")]
    public string FolderPath { get; set; } = string.Empty;

    [Column("access_type")]
    public AccessTypes AccessType { get; set; }

    [Column("confirm_access_type")]
    public AccessTypes ConfirmAccessType { get; set; }

    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    [Column("rejection_reason")]
    public string? RejectionReason { get; set; }

    [Column("hod_approver_id")]
    public int? HodApproverId { get; set; }

    [Column("it_approver_id")]
    public int? ItApproverId { get; set; }

    [Column("requested_at_utc")]
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;

    [Column("last_action_at_utc")]
    public DateTime LastActionAtUtc { get; set; } = DateTime.UtcNow;

    [Column("approved_at_utc")]
    public DateTime? ApprovedAtUtc { get; set; }

    [Column("expires_at_utc")]
    public DateTime? ExpiresAtUtc { get; set; }
}

[Table("jan_accessapproval")]
public sealed class AccessApprovalEntity
{
    [Key]
    [Column("accessapprove_id")]
    public int AccessApproveId { get; set; }

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("accessitem_id")]
    public int AccessItemId { get; set; }

    [Column("approver_id")]
    public int ApproverId { get; set; } //ref UserId

    [Column("approval_status")]
    public RequestStatus ApprovalStatus { get; set; }

    [Column("comments")]
    public string Comments { get; set; } = string.Empty;

    [Column("approval_level")]
    public string ApprovalLevel { get; set; } = string.Empty;

    [Column("actioned_at_utc")]
    public DateTime ActionedAtUtc { get; set; } = DateTime.UtcNow;
}

[Table("jan_accessreqaudit")]
public sealed class AccessReqAuditEntity
{
    [Key]
    [Column("audit_id")]
    public int AuditId { get; set; }

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("accessitem_id")]
    public int? AccessItemId { get; set; }

    [Column("accessapprove_id")]
    public int? AccessApproveId { get; set; } // ref UserId

    [Column("event_type")]
    public string EventType { get; set; } = string.Empty;

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("recipient_user_id")]
    public int RecipientUserId { get; set; } // ref UserId

    [Column("recipient_name")]
    public string RecipientName { get; set; } = string.Empty;

    [Column("recipient_role")]
    public string RecipientRole { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("actor_user_id")]
    public int? ActorUserId { get; set; }

    [Column("created_at_utc")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
