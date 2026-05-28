namespace CWM.CleanArchitecture.Application.Features.Todos.Create;

using CWM.CleanArchitecture.Application.Abstractions.Data;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;
using CWM.CleanArchitecture.Domain.Entities;

public sealed class CreateTodoCommandHandler(IAppDbContext dbContext) : ICommandHandler<CreateTodoCommand, Result<CreateTodoResponse>>
{
    public async Task<Result<CreateTodoResponse>> HandleAsync(CreateTodoCommand command, CancellationToken cancellationToken = default)
    {
        var todo = new TodoItem
        {
            Title = command.Title,
            Description = command.Description
        };

        dbContext.Todos.Add(todo);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new CreateTodoResponse(todo.Id, todo.Title, todo.Description);
        return Result.Success(response);
    }
}
