namespace MyFlightbook.Api.Controllers;

/// <summary>
/// Pilot currency REST endpoint.
///
/// GET /api/v1/currency — currency status for the current user
///
/// NOTE: Full regulatory currency (FAR 61.57, EASA, CASA, etc.) is complex rule-based
/// logic that should live in a dedicated ICurrencyService. This scaffold computes basic
/// recency statistics and maps them onto CurrencyItem rows. Replace with a proper
/// ICurrencyService implementation when ready.
/// </summary>
[ApiController]
[Route("api/v1/currency")]
[Authorize]
public class CurrencyController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public CurrencyController(AppDbContext db, IUserResolver resolver) : base(resolver)
        => _db = db;

    private sealed record CurrencyItem(
        string Attribute,
        string Value,
        string Status,          // "OK" | "GettingClose" | "NotCurrent" | "NoDate"
        string? Discrepancy,
        string? Query = null);

    [HttpGet]
    public async Task<IActionResult> GetCurrency()
    {
        var user     = await CurrentUserAsync();
        var cutoff90 = DateTime.UtcNow.AddDays(-90);

        var recent = await _db.Flights
            .Where(f => f.AppUserId == user.Id && f.Date >= cutoff90)
            .ToListAsync();

        var hasAnyFlight = await _db.Flights
            .AnyAsync(f => f.AppUserId == user.Id);

        if (!hasAnyFlight)
            return ApiOk(Array.Empty<CurrencyItem>());

        int landings90      = recent.Sum(f => f.Landings);
        int nightLandings90 = recent.Sum(f => f.NightLandings);
        int approaches90    = recent.Sum(f => f.Approaches);

        var items = new List<CurrencyItem>
        {
            // ── Day pax currency: 3 landings in 90 days (FAR 61.57(a)) ───────
            BuildLandingItem(
                "Day Pax Currency (FAR 61.57)",
                landings90, required: 3,
                $"{landings90} landing(s) / 90 days"),

            // ── Night pax currency: 3 night landings in 90 days (FAR 61.57(b)) ─
            BuildLandingItem(
                "Night Pax Currency (FAR 61.57)",
                nightLandings90, required: 3,
                $"{nightLandings90} night landing(s) / 90 days"),

            // ── IFR currency: 6 approaches in 6 months (FAR 61.57(c)) ─────────
            BuildLandingItem(
                "IFR Currency (FAR 61.57)",
                approaches90, required: 6,
                $"{approaches90} approach(es) / 90 days"),
        };

        return ApiOk(items);
    }

    private static CurrencyItem BuildLandingItem(
        string attribute, int count, int required, string displayValue)
    {
        if (count >= required)
            return new(attribute, displayValue, "OK", null);

        if (count > 0)
            return new(attribute, displayValue, "GettingClose",
                $"{required - count} more needed");

        return new(attribute, displayValue, "NotCurrent",
            $"{required} required, 0 in last 90 days");
    }
}
