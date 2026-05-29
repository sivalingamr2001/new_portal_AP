using Web.Application.Interfaces;

namespace Web.Application.Services;

public sealed class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(IReadOnlyCollection<string> to, string subject, string body)
    {
        if (to.Count == 0)
            return Task.CompletedTask;

        _logger.LogInformation(
            "Email queued to {Recipients}. Subject: {Subject}. Body: {Body}",
            string.Join(", ", to),
            subject,
            body);

        return Task.CompletedTask;
    }
}
