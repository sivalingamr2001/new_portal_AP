namespace CWM.CleanArchitecture.Application.Features.Todos.Create;

using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record CreateTodoCommand(string Title, string? Description) : ICommand<Result<CreateTodoResponse>>;

public sealed record CreateTodoResponse(Guid Id, string Title, string? Description);
