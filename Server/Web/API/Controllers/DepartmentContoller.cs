using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Common;
using Web.Domain.Dto;
using Web.Domain.Dto.Department;

namespace Web.API.Controllers;

[ApiController]
[Route("api/departments")]
public sealed class DepartmentsController(IDepartmentService service) : ControllerBase
{
    // GET api/departments?page=1&pageSize=20&search=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await service.GetAllAsync(page, pageSize, search));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertDepartmentDto dto)
    {
        var result = await service.UpdateAsync(id, dto, GetCallerId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await service.DeleteAsync(id, GetCallerId());
        return result.IsSuccess ? NoContent() : HandleFailure(result);
    }

    private int GetCallerId()
        => int.Parse(User.FindFirst("sub")?.Value
            ?? HttpContext.Request.Headers["X-User-Id"].ToString());

    private IActionResult HandleFailure(Result result) =>
        result.Error!.Type switch
        {
            ErrorType.NotFound => NotFound(result.Error),
            ErrorType.Validation => BadRequest(result.Error),
            ErrorType.Conflict => Conflict(result.Error),
            _ => StatusCode(500, result.Error)
        };
}
