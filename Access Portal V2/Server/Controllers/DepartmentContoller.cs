

using Microsoft.AspNetCore.Mvc;
using Server.Core.Domain.Dto;
using Server.Core.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentContoller(IDepartmentService departmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDepartments(
    [FromQuery] DepartmentSearchQueryParameters parameters)
    {
        var result = await departmentService.GetAllBySearchParamsAsync(parameters);
        return Ok(result);
    }

    [HttpGet("{departmentId:int}")]
    public async Task<IActionResult> GetDepartmentById(int departmentId)
    {
        var result = await departmentService.GetByIdAsync(departmentId);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateDepartment(
        [FromBody] UpdateDepartmentRequest request)
    {
        var result = await departmentService.UpdateAsync(request);

        if (result == null)
            return NotFound();

        return Ok(result);
    }
}