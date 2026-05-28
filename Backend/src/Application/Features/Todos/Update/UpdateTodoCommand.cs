namespace CWM.CleanArchitecture.Application.Features.Todos.Update;

using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record UpdateTodoCommand(Guid Id, string Title, string? Description) : ICommand;
