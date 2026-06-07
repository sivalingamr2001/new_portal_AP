using Server.Core.Domain.Dto;

namespace Server.Core.Interfaces;

/// <summary>
/// Defines the enterprise application contract for cross-database corporate user management profile operations.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Advanced Query Engine: Retrieves a paginated, filtered, and searchable collection of corporate profiles 
    /// from Connection 1, dynamically stitched with application details from Connection 2.
    /// </summary>
    /// <param name="searchTerm">An optional substring search parameter matched case-insensitively against user names, emails, or employee IDs.</param>
    /// <param name="roleFilter">An optional system role filter (e.g., Admin, IT, Hod, User) to narrow down the result boundaries.</param>
    /// <param name="locationFilter">An optional geographical location string filter.</param>
    /// <param name="pageNumber">The progressive dataset page index to retrieve (minimum base value is 1).</param>
    /// <param name="pageSize">The strict allocation threshold limiting records returned per page transaction loop block.</param>
    /// <returns>A unified paginated result wrapper containing the filtered subset of profiles along with complete page metrics metadata.</returns>
    Task<PaginatedListDto<UserProfileResponseDto>> GetPagedAndFilteredUsersAsync(
        string? searchTerm,
        string? roleFilter,
        string? locationFilter,
        int pageNumber,
        int pageSize);

    /// <summary>
    /// Looks up a complete, stitched profile matching a specific numeric directory primary key identifier.
    /// </summary>
    Task<UserProfileResponseDto?> GetUserByIdAsync(int userId);

    /// <summary>
    /// Looks up a complete, stitched profile matching a corporate email address string context.
    /// </summary>
    Task<UserProfileResponseDto?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Looks up a complete, stitched profile matching an alphanumeric corporate Employee Identification reference string code.
    /// </summary>
    Task<UserProfileResponseDto?> GetUserByEmpIdAsync(string empId);

    /// <summary>
    /// Retrieves all Head of Department (HOD) users.
    /// </summary>
    Task<PaginatedListDto<HodUserDto>> GetAllHodsAsync();

    /// <summary>
    /// Retrieves the Head of Department (HOD) for a specific department.
    /// </summary>
    Task<HodUserDto?> GetHodByDepartmentIdAsync(int departmentId);
}
