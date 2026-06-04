using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;
using Web.Domain.Enums;

namespace Web.Domain.Entities;

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

    [ForeignKey(nameof(AccessReqId))]
    public AccessRequestEntity AccessRequest { get; set; } = null!;

    public virtual ICollection<AccessApprovalEntity> AccessApprovals { get; set; } = new List<AccessApprovalEntity>();
    public virtual ICollection<AccessReqAuditEntity> AccessAudits { get; set; } = new List<AccessReqAuditEntity>();
}
