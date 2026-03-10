namespace MyFlightbook.Api.Controllers;

[ApiController]
[Route("api/v1/airports")]
public class AirportsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public AirportsController(AppDbContext db, IUserResolver resolver) : base(resolver)
        => _db = db;

    // ── GET /api/v1/airports/search?q={query} ─────────────────────────────────

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? q)
    {
        if (string.IsNullOrEmpty(q) || q.Length < 2)
            return ApiError("Query must be at least 2 characters.");

        string qUpper = q.ToUpperInvariant();
        string qLower = q.ToLowerInvariant();

        var airports = await _db.Airports
            .Where(a =>
                a.ICAO.ToUpper().StartsWith(qUpper) ||
                (a.IATA != null && a.IATA.ToUpper().StartsWith(qUpper)) ||
                a.Name.ToLower().Contains(qLower) ||
                (a.Municipality != null && a.Municipality.ToLower().Contains(qLower)))
            .Take(50)
            .Select(a => new AirportSearchResult(
                a.ICAO,
                a.IATA,
                a.Name,
                a.Municipality,
                a.IsoCountry))
            .ToListAsync();

        var ordered = airports
            .OrderBy(a => a.Icao.Equals(qUpper, StringComparison.OrdinalIgnoreCase) ? 0 :
                          a.Icao.StartsWith(qUpper, StringComparison.OrdinalIgnoreCase) ? 1 : 2)
            .Take(8)
            .ToList();

        return ApiOk(ordered);
    }
}

public record AirportSearchResult(
    string Icao,
    string? Iata,
    string Name,
    string? Municipality,
    string? IsoCountry);
