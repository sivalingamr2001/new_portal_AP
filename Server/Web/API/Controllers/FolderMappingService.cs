using Microsoft.AspNetCore.Mvc;
using Web.Application.Services;
using Web.Domain.Common;
using Web.Domain.Dto;

namespace Web.API.Controllers;

[ApiController]
[Route("api/folder-mappings")]
public sealed class FolderMappingsController(IFolderMappingService service) : ControllerBase
{
    // GET api/folder-mappings?page=1&pageSize=20&search=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await service.GetAllAsync(page, pageSize, search));

    // GET api/folder-mappings/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await service.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // POST api/folder-mappings
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFolderMappingRequest dto)
    {
        var result = await service.CreateAsync(dto, GetCallerId());
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value)
            : HandleFailure(result);
    }

    // PUT api/folder-mappings/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFolderMappingRequest dto)
    {
        var result = await service.UpdateAsync(id, dto, GetCallerId());
        return result.IsSuccess ? Ok() : HandleFailure(result);
    }

    // DELETE api/folder-mappings/{id}
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
