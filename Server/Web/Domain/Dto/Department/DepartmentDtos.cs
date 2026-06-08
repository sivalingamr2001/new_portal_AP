namespace Web.Domain.Dto.Department;

public sealed record DepartmentDetailDto(
    int Id,
    string? Name,
    string? HodId,     // Changed to string (Employee ID)
    string? Email,     // Changed to string (Email ID)
    string? HodName,   // Name fetched from HodMaster
    bool IsActive,
    DateTime CreatedOn
);

public sealed record UpsertDepartmentDto(
    string Name,
    string? HodId,     // Changed to string (Employee ID)
    string? Email      // Changed to string (Email ID)
);
