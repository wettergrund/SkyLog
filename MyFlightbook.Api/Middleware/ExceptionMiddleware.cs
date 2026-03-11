namespace MyFlightbook.Api.Middleware;

/// <summary>
/// Global exception handler. Converts unhandled exceptions to a consistent
/// JSON envelope: { ok: false, error: "message" }
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = ex switch
            {
                UnauthorizedAccessException => StatusCodes.Status403Forbidden,
                KeyNotFoundException        => StatusCodes.Status404NotFound,
                ArgumentException           => StatusCodes.Status400BadRequest,
                _                           => StatusCodes.Status500InternalServerError
            };

            string message = _env.IsDevelopment()
                ? ex.Message
                : context.Response.StatusCode switch
                {
                    400 => "Bad request.",
                    403 => "Access denied.",
                    404 => "Resource not found.",
                    _   => "An unexpected error occurred."
                };

            await context.Response.WriteAsJsonAsync(new { ok = false, error = message });
        }
    }
}
