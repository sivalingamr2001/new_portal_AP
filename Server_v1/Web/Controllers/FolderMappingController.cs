using Microsoft.AspNetCore.Mvc;
using Web.Application.Interfaces;
using Web.Domain.Dto;

namespace Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FolderMappingController : ControllerBase
{
    private readonly IFolderMappingService _folderMappingService;

    public FolderMappingController(IFolderMappingService folderMappingService)
    {
        _folderMappingService = folderMappingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _folderMappingService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var mapping = await _folderMappingService.GetByIdAsync(id);
        return mapping is null ? NotFound() : Ok(mapping);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFolderMappingRequest request)
    {
        var mapping = await _folderMappingService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = mapping.Id }, mapping);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertFolderMappingRequest request)
    {
        var mapping = await _folderMappingService.UpdateAsync(id, request);
        return mapping is null ? NotFound() : Ok(mapping);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _folderMappingService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("parents")]
    public async Task<IActionResult> GetParentFolders()
    {
        var folders = await _folderMappingService.GetParentFoldersAsync();
        return Ok(folders);
    }

    [HttpGet("hierarchy")]
    public async Task<IActionResult> GetFolderHierarchy()
    {
        var hierarchy = await _folderMappingService.GetFolderHierarchyAsync();
        return Ok(hierarchy);
    }
}
