using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_accessreqaudit")]
public class AccessReqAuditEntity : BaseEntity
{
    [Key]
    [Column("audit_id")]
    public int AuditId { get; set; }

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("accessitem_id")]
    public int? AccessItemId { get; set; }

    [Column("accessapprove_id")]
    public int? AccessApproveId { get; set; }

    [Required]
    [Column("event_type")]
    [StringLength(50)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [Column("message")]
    [StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    [Column("recipient_user_id")]
    public int RecipientUserId { get; set; }

    [Required]
    [Column("recipient_name")]
    [StringLength(150)]
    public string RecipientName { get; set; } = string.Empty;

    [Required]
    [Column("recipient_role")]
    [StringLength(50)]
    public string RecipientRole { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    // Relationship Links
    [ForeignKey(nameof(RecipientUserId))]
    public virtual UserAccount RecipientUser { get; set; } = null!;

    [ForeignKey(nameof(AccessReqId))]
    public virtual AccessRequestEntity? AccessRequest { get; set; }
}
