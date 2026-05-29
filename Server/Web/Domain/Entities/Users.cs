namespace Web.Domain.Entities;

public sealed class User
{
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}