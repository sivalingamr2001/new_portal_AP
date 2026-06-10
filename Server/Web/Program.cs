using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Server.Infrastructure.Oracle;
using Web.Application.Interfaces;
using Web.Application.Services;
using Web.Infrastructure.BackgroundServices;
using Web.Infrastructure.Data;
using Web.Infrastructure.Data.Seeding;
using Web.Infrastructure.Hubs;
using Web.Shared.Utilites.EmailService;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. CONFIGURATION & VARIABLES
// =========================================================================
var connectionStringCmpl = builder.Configuration.GetConnectionString("MySQLConnection_CMPL");
var connectionStringHod = builder.Configuration.GetConnectionString("MySQLConnection_HOD");
var dbProvider = builder.Configuration.GetValue<string>("Database:Provider");

// =========================================================================
// 2. CORE SYSTEM SERVICES (DI Framework Foundations Must Load First!)
// =========================================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSignalR();
builder.Services.AddProblemDetails();

// Configured Swagger to accept and inject the X-User-Id header globally
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Web API", Version = "v1" });

    const string schemeId = "UserIdHeader";

    // 1. Define the custom header input field configuration
    c.AddSecurityDefinition(schemeId, new OpenApiSecurityScheme
    {
        Description = "Enter your numeric User ID directly to authenticate requests (e.g., 1).",
        In = ParameterLocation.Header,
        Name = "X-User-Id",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

    // FIXED: Passed as a direct object initializer instead of a lambda expression delegate
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = schemeId
                }
            },
            new List<string>() // Empty list representing no specific OAuth scopes required
        }
    });
});

// =========================================================================
// 3. CORS CONFIGURATION
// =========================================================================
const string CorsPolicyName = "SignalRAndApiPolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// =========================================================================
// 4. DATABASE CONTEXTS
// =========================================================================
var providerName = dbProvider?.Trim();
bool isMySql = !string.IsNullOrEmpty(providerName) && providerName.Equals("MySQL", StringComparison.OrdinalIgnoreCase);

var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
var sqliteConnection = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=app.db";

if (isMySql)
{
    var appServerVersion = ServerVersion.AutoDetect(defaultConnection);
    var externalServerVersion = ServerVersion.AutoDetect(connectionStringCmpl);

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMySql(defaultConnection, appServerVersion));

    builder.Services.AddDbContext<CmplDbContext>(options =>
        options.UseMySql(connectionStringCmpl, externalServerVersion));

    builder.Services.AddDbContext<HodDbContext>(options =>
        options.UseMySql(connectionStringHod, externalServerVersion));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(sqliteConnection));

    builder.Services.AddDbContext<CmplDbContext>(options =>
        options.UseSqlite(sqliteConnection));

    builder.Services.AddDbContext<HodDbContext>(options =>
        options.UseSqlite(sqliteConnection));
}

// =========================================================================
// 5. APPLICATION SERVICES (DI REGISTRATION)
// =========================================================================
// Register as both a manual utility service and a background engine task
builder.Services.AddSingleton<DailyUserDeptSyncService>();
builder.Services.AddSingleton<IDailyUserDeptSyncService>(sp => sp.GetRequiredService<DailyUserDeptSyncService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<DailyUserDeptSyncService>());

// ✅ These services can now cleanly resolve IHubContext<NotificationHub> because AddSignalR() has executed above!
builder.Services.AddScoped<IAccessRequestService, AccessRequestService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHodCartService, HodCartService>();
builder.Services.AddScoped<IOperatorCartService, OperatorCartService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IFolderMappingService, FolderMappingService>();
builder.Services.AddScoped<FolderService>();
builder.Services.AddScoped<FolderServiceLocal>();
builder.Services.AddScoped<IOracleService, OracleService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAccessRequestEmailNotificationService, AccessRequestEmailNotificationService>();

// =========================================================================
// 6. PIPELINE & MIDDLEWARE BUILD
// =========================================================================
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var env = services.GetRequiredService<IWebHostEnvironment>();
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");
    var db = services.GetRequiredService<AppDbContext>();

    if (!isMySql)
    {
        try
        {
            var cmplDb = services.GetRequiredService<CmplDbContext>();
            var hodDb = services.GetRequiredService<HodDbContext>();

            logger.LogInformation("Database structure ready. Triggering initial User and Department baseline sync...");

            var syncService = services.GetRequiredService<IDailyUserDeptSyncService>();

            await syncService.TriggerSyncAsync(CancellationToken.None);

            logger.LogInformation("Initial baseline synchronization finished successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during local database seed or data sync execution.");
        }
    }
    else
    {
        try
        {
            var databaseName = db.Database.GetDbConnection().Database;
            logger.LogInformation("Ensuring AppDbContext tables exist in MySQL database '{DatabaseName}'.", databaseName);

            await db.Database.EnsureCreatedAsync();
            logger.LogInformation("AppDbContext schema ensured for MySQL database '{DatabaseName}'.", databaseName);

            var configuration = services.GetRequiredService<IConfiguration>();

            logger.LogInformation("Checking if 'Folders' table requires initial high-speed data import...");
            if (!await db.Folders.AnyAsync())
            {
                logger.LogWarning("'Folders' table is empty. Initiating data importer routine...");
                await FolderDataSeeding.ExecuteImportAsync();
            }
            else
            {
                logger.LogInformation("'Folders' table already contains data records. Seeding skipped.");
            }

            logger.LogInformation("Database structure ready. Triggering initial User and Department baseline sync...");

            var syncService = services.GetRequiredService<IDailyUserDeptSyncService>();

            await syncService.TriggerSyncAsync(CancellationToken.None);

            logger.LogInformation("Initial baseline synchronization finished successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing AppDbContext tables, bulk seeding, or running baseline sync tasks.");
        }
    }

}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsRedirection();

app.UseCors(CorsPolicyName);

// =========================================================================
// 7. ENDPOINT MAPPINGS
// =========================================================================
app.UseDefaultFiles();

// 2. Enables serving files directly from the wwwroot directory (js, css, images, html)
app.UseStaticFiles();

app.UseRouting();

// Add app.UseAuthentication() and app.UseAuthorization() here if you have them

app.MapControllers();

// 3. Fallback route: Maps all non-API routing requests straight to your client-side index file
app.MapFallbackToFile("index.html");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
