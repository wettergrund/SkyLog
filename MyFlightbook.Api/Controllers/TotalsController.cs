namespace MyFlightbook.Api.Controllers;

/// <summary>
/// Flight totals REST endpoint.
///
/// GET /api/v1/totals — aggregate totals for the current user
///
/// Future: accept a base64-compressed FlightQuery to scope totals to a subset of flights.
/// </summary>
[ApiController]
[Route("api/v1/totals")]
[Authorize]
public class TotalsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public TotalsController(AppDbContext db, IUserResolver resolver) : base(resolver)
        => _db = db;

    private sealed record TotalsItem(
        string Description,
        double Value,
        string NumericType,   // "Time" | "Integer" | "Decimal" | "Currency"
        string Group,
        string? SubDescription = null,
        string? Query = null);

    [HttpGet]
    public async Task<IActionResult> GetTotals()
    {
        var user = await CurrentUserAsync();

        var agg = await _db.Flights
            .Where(f => f.AppUserId == user.Id)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalFlights    = g.Count(),
                TotalTime       = (double)g.Sum(f => f.TotalFlightTime),
                PIC             = (double)g.Sum(f => f.PIC),
                SIC             = (double)g.Sum(f => f.SIC),
                Dual            = (double)g.Sum(f => f.Dual),
                CFI             = (double)g.Sum(f => f.CFI),
                CrossCountry    = (double)g.Sum(f => f.CrossCountry),
                Night           = (double)g.Sum(f => f.Nighttime),
                IMC             = (double)g.Sum(f => f.IMC),
                SimulatedIFR    = (double)g.Sum(f => f.SimulatedIFR),
                GroundSim       = (double)g.Sum(f => f.GroundSim),
                TotalApproaches = g.Sum(f => f.Approaches),
                TotalLandings   = g.Sum(f => f.Landings),
                NightLandings   = g.Sum(f => f.NightLandings)
            })
            .FirstOrDefaultAsync();

        // No flights yet — return empty array
        if (agg is null)
            return ApiOk(new { useHHMM = user.UsesHHMM, totals = Array.Empty<TotalsItem>() });

        var totals = new List<TotalsItem>
        {
            // ── Flight Time ──────────────────────────────────────────────────
            new("Total Time",       agg.TotalTime,    "Time",    "Flight Time"),
            new("PIC",              agg.PIC,          "Time",    "Flight Time"),
            new("SIC",              agg.SIC,          "Time",    "Flight Time"),
            new("Dual Received",    agg.Dual,         "Time",    "Flight Time"),
            new("CFI",              agg.CFI,          "Time",    "Flight Time"),
            new("Cross Country",    agg.CrossCountry, "Time",    "Flight Time"),
            new("Night",            agg.Night,        "Time",    "Flight Time"),
            new("IMC",              agg.IMC,          "Time",    "Flight Time"),
            new("Simulated IFR",    agg.SimulatedIFR, "Time",    "Flight Time"),
            new("Ground Sim",       agg.GroundSim,    "Time",    "Flight Time"),

            // ── Landings & Approaches ─────────────────────────────────────────
            new("Total Landings",   agg.TotalLandings,   "Integer", "Landings & Approaches"),
            new("Night Landings",   agg.NightLandings,   "Integer", "Landings & Approaches"),
            new("Approaches",       agg.TotalApproaches, "Integer", "Landings & Approaches"),

            // ── Flights ───────────────────────────────────────────────────────
            new("Total Flights",    agg.TotalFlights, "Integer", "Flights"),
        };

        // Omit rows where value is zero to keep the table tidy
        var nonZero = totals.Where(t => t.Value != 0).ToList();

        return ApiOk(new { useHHMM = user.UsesHHMM, totals = nonZero });
    }
}
