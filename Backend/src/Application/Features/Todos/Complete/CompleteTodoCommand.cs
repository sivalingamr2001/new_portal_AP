namespace CWM.CleanArchitecture.Application.Features.Todos.Complete;

using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed record CompleteTodoCommand(Guid Id) : ICommand;
