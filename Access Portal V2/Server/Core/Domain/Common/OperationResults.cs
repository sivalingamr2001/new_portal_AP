namespace Server.Core.Domain.Common;

public enum ErrorType
{
    NotFound,
    Validation,
    Conflict,
    Unexpected
}

public sealed class Error
{
    public string Code { get; init; }
    public string Message { get; init; }
    public ErrorType Type { get; init; }
    public object? Details { get; init; }

    public Error(string code, string message, ErrorType type, object? details = null)
    {
        Code = code;
        Message = message;
        Type = type;
        Details = details;
    }

    public static Error NotFound(string code, string message, object? details = null)
        => new(code, message, ErrorType.NotFound, details);

    public static Error Validation(string code, string message, object? details = null)
        => new(code, message, ErrorType.Validation, details);

    public static Error Conflict(string code, string message, object? details = null)
        => new(code, message, ErrorType.Conflict, details);

    public static Error Unexpected(string code, string message, object? details = null)
        => new(code, message, ErrorType.Unexpected, details);
}

public class Result
{
    public bool IsSuccess { get; init; }
    public Error? Error { get; init; }

    protected Result(bool isSuccess, Error? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, null);

    public static Result Failure(Error error) => new(false, error);

    public static Result<T> Success<T>(T value) => Result<T>.Success(value);

    public static Result<T> Failure<T>(Error error) => Result<T>.Failure(error);
}

public sealed class Result<T> : Result
{
    public T? Value { get; init; }

    private Result(bool isSuccess, T? value, Error? error)
        : base(isSuccess, error)
    {
        Value = value;
    }

    public static Result<T> Success(T value) => new(true, value, null);

    public static new Result<T> Failure(Error error) => new(false, default, error);
}

public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; }
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }

    public PagedResult(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
