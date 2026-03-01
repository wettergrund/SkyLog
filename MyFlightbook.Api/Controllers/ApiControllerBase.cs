namespace MyFlightbook.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected readonly IUserResolver _userResolver;

    protected ApiControllerBase(IUserResolver userResolver)
        => _userResolver = userResolver;

    /// <summary>Resolves the Firebase JWT to a local AppUser (auto-provisions on first call).</summary>
    protected Task<AppUser> CurrentUserAsync() =>
        _userResolver.GetOrCreateAsync(User);

    /// <summary>200 OK with consistent envelope: { ok: true, data: ... }</summary>
    protected IActionResult ApiOk<T>(T data) =>
        Ok(new { ok = true, data });

    /// <summary>200 OK with no data payload.</summary>
    protected IActionResult ApiOk() =>
        Ok(new { ok = true, data = (object?)null });

    /// <summary>Error response with consistent envelope: { ok: false, error: "..." }</summary>
    protected IActionResult ApiError(string message, HttpStatusCode status = HttpStatusCode.BadRequest) =>
        StatusCode((int)status, new { ok = false, error = message });
}
