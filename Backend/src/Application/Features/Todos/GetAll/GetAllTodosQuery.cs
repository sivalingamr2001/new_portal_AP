namespace CWM.CleanArchitecture.Application.Features.Todos.GetAll;

using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Application.Features.Todos.Get;
using CWM.CleanArchitecture.Domain.Common;

public sealed record GetAllTodosQuery(int Page = 1, int PageSize = 10) : IQuery<Result<PagedResult<TodoDetailResponse>>>;
