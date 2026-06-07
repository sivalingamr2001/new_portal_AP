using System.ComponentModel.DataAnnotations;

namespace Server.Core.Domain.Dto;

public sealed class UpdateDepartmentRequest

{

    [Required]

    public int DepartmentId { get; set; }

    [Required]

    [MaxLength(150)]

    public string DepartmentName { get; set; } = string.Empty;

    public int? HodId { get; set; }

}

public sealed class DepartmentDetailResponse

{

    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = string.Empty;

    public int? HodId { get; set; }
    
    public HodDetailResponse? Hod { get; set; }
    
}

public sealed class HodDetailResponse
{
    public string? HodName { get; set; }

    public string? HodEmployeeId { get; set; }

    public string? HodEmail { get; set; }

    public long? HodMobileNumber { get; set; }
}