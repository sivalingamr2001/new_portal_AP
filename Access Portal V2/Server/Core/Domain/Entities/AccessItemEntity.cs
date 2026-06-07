using Server.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_accessitems")]
public class AccessItemEntity : BaseEntity
{
    [Key]
    [Column("accessitem_id")]
    public int AccessItemId { get; set; }

    [Required]
    [Column("ticket_number")]
    [StringLength(50)]
    public string TicketNumber { get; set; } = string.Empty;

    [Column("accessreq_id")]
    public int AccessReqId { get; set; }

    [Column("status")]
    public RequestStatus Status { get; set; }

    [Required]
    [Column("folder_path")]
    [StringLength(500)]
    public string FolderPath { get; set; } = string.Empty;

    [Column("access_type")]
    public AccessTypes AccessType { get; set; }

    [Column("confirm_access_type")]
    public AccessTypes ConfirmAccessType { get; set; }

    [Required]
    [Column("reason")]
    [StringLength(250)]
    public string Reason { get; set; } = string.Empty;

    [Column("access_from")]
    public DateTime? AccessFrom { get; set; }

    [Column("access_to")]
    public DateTime? AccessTo { get; set; }

    [Column("revoked_on")]
    public DateTime? RevokedOn { get; set; }

    [Column("revoked_by")]
    public int? RevokedBy { get; set; }

    [ForeignKey(nameof(AccessReqId))]
    public virtual AccessRequestEntity AccessRequest { get; set; } = null!;
}
