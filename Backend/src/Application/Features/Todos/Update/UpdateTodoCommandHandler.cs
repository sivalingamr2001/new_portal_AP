namespace CWM.CleanArchitecture.Application.Features.Todos.Update;

using CWM.CleanArchitecture.Application.Abstractions.Data;
using CWM.CleanArchitecture.Application.Abstractions.Messaging;
using CWM.CleanArchitecture.Domain.Common;

public sealed class UpdateTodoCommandHandler(IAppDbContext dbContext) : ICommandHandler<UpdateTodoCommand>
{
    public async Task<Result> HandleAsync(UpdateTodoCommand command, CancellationToken cancellationToken = default)
    {
        var todo = await dbContext.Todos.FindAsync([command.Id], cancellationToken);
        if (todo is null)
            return Result.Failure(Error.NotFound("Todo.NotFound", $"Todo with ID '{command.Id}' was not found."));

        todo.Title = command.Title;
        todo.Description = command.Description;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
