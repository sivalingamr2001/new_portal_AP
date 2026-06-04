using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Web.Domain.Common;

namespace Web.Domain.Entities;

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

    [Column("ticket_number")]
    [MaxLength(50)]
    public string? TicketNumber { get; set; }

    [NotMapped]
    public DateTime? ReadAtUtc => IsRead ? ModifiedOn : null;
}
