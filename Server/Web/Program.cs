using Microsoft.EntityFrameworkCore;
using Server.Shared.Helpers;
using Web.Application.Interfaces;
using Web.Application.Services;
using Web.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Define CORS Policy Name
const string MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Services
builder.Services.AddControllers();

// 2. Configure CORS service
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // No trailing slash here
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Allows cookies/auth headers if needed
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));

builder.Services.AddSingleton<FolderService>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFolderMappingService, FolderMappingService>();
builder.Services.AddScoped<IAccessRequestService, AccessRequestService>();
builder.Services.AddScoped<IApprovalService, ApprovalService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<ExpiryBackgroundService>();

builder.Services.AddProblemDetails();

var app = builder.Build();

// Ensure DB exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("AppDataSeeder");

    await WorkflowSchemaInitializer.EnsureCreatedAsync(db);
    await AppDataSeeder.SeedIfNeededAsync(db, env, logger);
}

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsRedirection();

// 3. Enable CORS middleware (Must be placed before MapControllers)
app.UseCors(MyAllowSpecificOrigins);

app.MapControllers();

app.Run();
