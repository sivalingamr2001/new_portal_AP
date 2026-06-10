using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;
using Server.Infrastructure.Oracle;
using Web.Application.Interfaces;
using Web.Application.Services;
using Web.Infrastructure.BackgroundServices;
using Web.Infrastructure.Data;
using Web.Infrastructure.Data.Seeding;
using Web.Infrastructure.Hubs;
using Web.Shared.Utilites.EmailService;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// SERILOG CONFIGURATION (Captures application-wide telemetry)
// =========================================================================
builder.Services.AddSerilog((services, lc) => lc
    .Enrich.WithMachineName()
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services));

// =========================================================================
// 1. CONFIGURATION & VARIABLES
// =========================================================================
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
var connectionStringCmpl = builder.Configuration.GetConnectionString("MySQLConnection_CMPL");
var connectionStringHod = builder.Configuration.GetConnectionString("MySQLConnection_HOD");

// =========================================================================
// 2. CORE SYSTEM SERVICES
// =========================================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();
builder.Services.AddProblemDetails();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Web API", Version = "v1" });

    const string schemeId = "UserIdHeader";

    c.AddSecurityDefinition(schemeId, new OpenApiSecurityScheme
    {
        Description = "Enter your numeric User ID directly to authenticate requests (e.g., 1).",
        In = ParameterLocation.Header,
        Name = "X-User-Id",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

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
            new List<string>()
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
// 4. DATABASE CONTEXTS (STRICT MYSQL CONFIGURATION)
// =========================================================================
var mySqlServerVersion = new MySqlServerVersion(new Version(8, 0, 0));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(defaultConnection, mySqlServerVersion));

builder.Services.AddDbContext<CmplDbContext>(options =>
    options.UseMySql(connectionStringCmpl, mySqlServerVersion));

builder.Services.AddDbContext<HodDbContext>(options =>
    options.UseMySql(connectionStringHod, mySqlServerVersion));

// =========================================================================
// 5. APPLICATION SERVICES (DI REGISTRATION)
// =========================================================================
builder.Services.AddSingleton<DailyUserDeptSyncService>();
builder.Services.AddSingleton<IDailyUserDeptSyncService>(sp => sp.GetRequiredService<DailyUserDeptSyncService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<DailyUserDeptSyncService>());

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

// Wrap the entire startup verification sequence in a defensive try/catch block
// This prevents unhandled database or I/O exceptions from causing an HTTP 500.30 crash.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");

    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        var cmplDb = services.GetRequiredService<CmplDbContext>();
        var hodDb = services.GetRequiredService<HodDbContext>();

        logger.LogInformation("Testing database connectivity for all environments...");

        var appDbName = db.Database.GetDbConnection().Database;
        if (await db.Database.CanConnectAsync())
        {
            logger.LogInformation("✅ Successfully connected to AppDbContext MySQL database: '{DatabaseName}'", appDbName);
        }
        else
        {
            logger.LogCritical("❌ CRITICAL: Could not connect to AppDbContext MySQL database: '{DatabaseName}'", appDbName);
        }

        var cmplDbName = cmplDb.Database.GetDbConnection().Database;
        if (await cmplDb.Database.CanConnectAsync())
        {
            logger.LogInformation("✅ Successfully connected to CmplDbContext MySQL database: '{DatabaseName}'", cmplDbName);
        }
        else
        {
            logger.LogError("❌ ERROR: Could not connect to CmplDbContext MySQL database: '{DatabaseName}'", cmplDbName);
        }

        var hodDbName = hodDb.Database.GetDbConnection().Database;
        if (await hodDb.Database.CanConnectAsync())
        {
            logger.LogInformation("✅ Successfully connected to HodDbContext MySQL database: '{DatabaseName}'", hodDbName);
        }
        else
        {
            logger.LogError("❌ ERROR: Could not connect to HodDbContext MySQL database: '{DatabaseName}'", hodDbName);
        }

        // Execute table logic schema builds safely
        logger.LogInformation("Ensuring AppDbContext tables exist in MySQL database '{DatabaseName}'.", appDbName);
        await db.Database.EnsureCreatedAsync();
        logger.LogInformation("AppDbContext schema ensured for MySQL database '{DatabaseName}'.", appDbName);

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
        // Caught errors are pushed straight into your Serilog file output targets while letting the Web Server run smoothly
        logger.LogCritical(ex, "FATAL STARTUP EXCEPTION: The database schema initialization or baseline sync failed, but the web host will stay alive.");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web API v1");
    c.RoutePrefix = "swagger";
});

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSerilogRequestLogging();

app.UseHttpsRedirection();
app.UseCors(CorsPolicyName);

// =========================================================================
// 7. ENDPOINT MAPPINGS
// =========================================================================
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();

app.MapControllers();
app.MapFallbackToFile("index.html");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
