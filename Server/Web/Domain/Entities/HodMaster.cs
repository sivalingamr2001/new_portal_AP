namespace Web.Domain.Entities;

public sealed class HodMaster
{
    public int IdRow { get; set; } //User_id
    public string HodName { get; set; } = string.Empty;
    public string? Id { get; set; } //emp_id
    public string? EmailId { get; set; }
    public string? MobNo { get; set; }
}

