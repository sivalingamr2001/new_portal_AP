using System.ComponentModel.DataAnnotations;

namespace Server.Core.Domain.Dto;

/// <summary>
/// Unified query parameter model for filtering, searching, and paginating the user directory.
/// </summary>
public sealed class UserSearchQueryParameters
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    /// <summary>
    /// Search term to match against UserName, MailId, or EmpId (Case-Insensitive substring match).
    /// </summary>
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Optional filter to isolate users by their explicit system role (e.g., Admin, IT, Hod, User).
    /// </summary>
    public string? RoleFilter { get; set; }

    /// <summary>
    /// Optional filter to isolate users by location.
    /// </summary>
    public string? LocationFilter { get; set; }

    /// <summary>
    /// The page index number to request (Starts at 1).
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than or equal to 1.")]
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Number of profile records to return per page. Max limit is 100.
    /// </summary>
    [Range(1, MaxPageSize, ErrorMessage = "Page size must be between 1 and 100.")]
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}

public sealed class DepartmentSearchQueryParameters

{

    private const int MaxPageSize = 100;

    private int _pageSize = 20;

    /// <summary>

    /// Search by department name.

    /// </summary>

    public string? SearchTerm { get; set; }

    /// <summary>

    /// Filter by HOD Id.

    /// </summary>

    public int? HodId { get; set; }

    [Range(1, int.MaxValue)]

    public int PageNumber { get; set; } = 1;

    [Range(1, MaxPageSize)]

    public int PageSize

    {

        get => _pageSize;

        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;

    }

}

/// <summary>
/// Structured metadata wrapper returning paginated database rows cleanly to front-end grids.
/// </summary>
public sealed class PaginatedListDto<T>(IEnumerable<T> items, int count, int pageNumber, int pageSize)
{
    public IEnumerable<T> Items { get; init; } = items;
    public int PageNumber { get; init; } = pageNumber;
    public int PageSize { get; init; } = pageSize;
    public int TotalCount { get; init; } = count;
    public int TotalPages { get; init; } = (int)Math.Ceiling(count / (double)pageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
