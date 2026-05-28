namespace CWM.CleanArchitecture.Application.Features.Todos.GetAll;

using CWM.CleanArchitecture.Application.Abstractions.Data;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Application.Features.Todos.Get;
using CWM.CleanArchitecture.Domain.Common;
using Microsoft.EntityFrameworkCore;

public sealed class GetAllTodosQueryHandler(IAppDbContext dbContext) : IQueryHandler<GetAllTodosQuery, Result<PagedResult<TodoDetailResponse>>>
{
    public async Task<Result<PagedResult<TodoDetailResponse>>> HandleAsync(GetAllTodosQuery query, CancellationToken cancellationToken = default)
    {
        var totalCount = await dbContext.Todos.CountAsync(cancellationToken);

        var items = await dbContext.Todos
            .OrderByDescending(t => t.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(t => new TodoDetailResponse(t.Id, t.Title, t.Description, t.IsCompleted, t.CompletedAt, t.CreatedAt))
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<TodoDetailResponse>(items, totalCount, query.Page, query.PageSize);
        return Result.Success(pagedResult);
    }
}
