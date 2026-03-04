using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyFlightbook.Data.Data;

var builder = FunctionsApplication.CreateBuilder( args );

builder.ConfigureFunctionsWebApplication();

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

// 1. Grab your connection string
// In local.settings.json, this should be under "Values": { "SqlConnectionString": "..." }
string connectionString = Environment.GetEnvironmentVariable( "SqlConnectionString" )
    ?? throw new InvalidOperationException( "Connection string 'SqlConnectionString' not found." );

// 2. Register the DbContext from your shared library
builder.Services.AddDbContext<AppDbContext>( options =>
    options.UseSqlServer( connectionString ) );

builder.Build().Run();
