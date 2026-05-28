namespace CWM.CleanArchitecture.Application.Abstractions.Messaging;

using CWM.CleanArchitecture.Domain.Common;

public interface ICommand : ICommand<Result>;

public interface ICommand<TResponse>;
