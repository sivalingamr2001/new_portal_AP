namespace Web.Application.Interfaces;

public interface IEmailService
{
    Task SendAsync(IReadOnlyCollection<string> to, string subject, string body);
}
