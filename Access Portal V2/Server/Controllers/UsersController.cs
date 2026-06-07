using Microsoft.AspNetCore.Mvc;
using Server.Core.Domain.Dto;
using Server.Core.Interfaces;

namespace Server.Api.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(IUserService userService) : ControllerBase
{
    /// <summary>
    /// GET: api/users
    /// Retrieves a paginated, filtered, and searchable stream of all corporate accounts.
    /// Usage: api/users?searchTerm=john&roleFilter=Hod&pageNumber=1&pageSize=20
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedListDto<UserProfileResponseDto>))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll([FromQuery] UserSearchQueryParameters query)
    {
        // Access layer delegates parameter values fluently to the database stitching context
        var result = await userService.GetPagedAndFilteredUsersAsync(
            searchTerm: query.SearchTerm,
            roleFilter: query.RoleFilter,
            locationFilter: query.LocationFilter,
            pageNumber: query.PageNumber,
            pageSize: query.PageSize
        );

        return Ok(result);
    }

    [HttpGet("id/{userId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserProfileResponseDto))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] int userId)
    {
        var result = await userService.GetUserByIdAsync(userId);
        if (result == null)
        {
            return NotFound(new { error = $"User identifier #{userId} does not exist in corporate directories." });
        }
        return Ok(result);
    }

    [HttpGet("email/{email}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserProfileResponseDto))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByEmail([FromRoute] string email)
    {
        var result = await userService.GetUserByEmailAsync(email);
        if (result == null)
        {
            return NotFound(new { error = $"No profile associated with the email address '{email}' could be located." });
        }
        return Ok(result);
    }

    [HttpGet("empid/{empId}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserProfileResponseDto))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByEmpId([FromRoute] string empId)
    {
        var result = await userService.GetUserByEmpIdAsync(empId);
        if (result == null)
        {
            return NotFound(new { error = $"Employee record reference code '{empId}' maps to no active registry profiles." });
        }
        return Ok(result);
    }

    [HttpGet("hods")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<HodUserDto>))]
    public async Task<IActionResult> GetAllHods()
    {
        var result = await userService.GetAllHodsAsync();
        return Ok(result);
    }

    [HttpGet("hod/{departmentId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(HodUserDto))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHodByDepartmentId([FromRoute] int departmentId)
    {
        var result = await userService.GetHodByDepartmentIdAsync(departmentId);
        if (result == null)
        {
            return NotFound(new { error = $"No Head of Department (HOD) found for department identifier #{departmentId}." });
        }

        return Ok(result);
    }
}
