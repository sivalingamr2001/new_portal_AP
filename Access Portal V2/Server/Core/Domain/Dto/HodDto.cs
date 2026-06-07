namespace Server.Core.Domain.Dto;

public class HodUserDto
{
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public int? DepartmentId { get; set; }
}