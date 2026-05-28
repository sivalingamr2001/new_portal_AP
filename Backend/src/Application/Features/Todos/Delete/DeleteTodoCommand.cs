namespace CWM.CleanArchitecture.Application.Features.Todos.Delete;

using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record DeleteTodoCommand(Guid Id) : ICommand;
