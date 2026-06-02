using System.ComponentModel.DataAnnotations.Schema;

namespace Web.Domain.Entities;

[Table("jan_portal_users")]
public sealed class User
{
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}
