using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Core.Domain.Entities;

[Table("jan_portal_users_details")]
public class UserDetail : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("user_role")]
    [StringLength(20)]
    public string UserRole { get; set; } = "User"; // Admin, IT, Hod, User

    [Column("location")]
    [StringLength(100)]
    public string? Location { get; set; }
}
