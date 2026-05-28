namespace CWM.CleanArchitecture.Application.Features.Todos.Get;

using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record GetTodoQuery(Guid Id) : IQuery<Result<TodoDetailResponse>>;

public sealed record TodoDetailResponse(Guid Id, string Title, string? Description, bool IsCompleted, DateTimeOffset? CompletedAt, DateTimeOffset CreatedAt);
