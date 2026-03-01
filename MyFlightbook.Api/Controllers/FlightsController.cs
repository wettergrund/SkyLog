namespace MyFlightbook.Api.Controllers;

/// <summary>
/// Flight logbook REST endpoints.
///
/// GET    /api/v1/flights              — paginated list for the current user
/// GET    /api/v1/flights/{id}         — single flight by ID
/// POST   /api/v1/flights              — create a new flight
/// DELETE /api/v1/flights/{id}         — delete a single flight
/// POST   /api/v1/flights/batch-delete — delete multiple flights { ids: [1,2,3] }
///
/// Query parameters for GET /api/v1/flights:
///   skip      — offset (default 0)
///   limit     — page size 1–100 (default 25)
///   sortKey   — "date" | "totalFlightTime" | "route" (default "date")
///   sortDir   — "Ascending" | "Descending" (default "Descending")
/// </summary>
[ApiController]
[Route("api/v1/flights")]
[Authorize]
public class FlightsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public FlightsController(AppDbContext db, IUserResolver resolver) : base(resolver)
        => _db = db;

    // ── GET /api/v1/flights ───────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetFlights(
        int skip = 0,
        int limit = 25,
        string sortKey = "date",
        string sortDir = "Descending")
    {
        var user = await CurrentUserAsync();
        limit = Math.Clamp(limit, 1, 100);
        skip  = Math.Max(0, skip);

        var query = _db.Flights
            .Where(f => f.AppUserId == user.Id)
            .Include(f => f.Aircraft).ThenInclude(a => a.MakeModel)
            .Include(f => f.Properties).ThenInclude(p => p.PropertyType);

        var total = await query.CountAsync();

        bool desc = !string.Equals(sortDir, "Ascending", StringComparison.OrdinalIgnoreCase);
        var ordered = sortKey.ToLowerInvariant() switch
        {
            "totalflighttime" => desc ? query.OrderByDescending(f => f.TotalFlightTime)
                                      : query.OrderBy(f => f.TotalFlightTime),
            "route"           => desc ? query.OrderByDescending(f => f.Route)
                                      : query.OrderBy(f => f.Route),
            _                 => desc ? query.OrderByDescending(f => f.Date)
                                      : query.OrderBy(f => f.Date)
        };

        var flights = await ordered.Skip(skip).Take(limit).ToListAsync();

        return ApiOk(new
        {
            flights    = flights.Select(ToDto),
            totalCount = total,
            skip,
            limit,
            sortKey,
            sortDir
        });
    }

    // ── GET /api/v1/flights/{id} ──────────────────────────────────────────────

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetFlight(int id)
    {
        var user = await CurrentUserAsync();

        var flight = await _db.Flights
            .Include(f => f.Aircraft).ThenInclude(a => a.MakeModel)
            .Include(f => f.Properties).ThenInclude(p => p.PropertyType)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (flight is null)
            return ApiError("Flight not found.", HttpStatusCode.NotFound);

        if (flight.AppUserId != user.Id)
            return ApiError("Not authorised to view this flight.", HttpStatusCode.Forbidden);

        return ApiOk(ToDto(flight));
    }

    // ── POST /api/v1/flights ──────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreateFlight([FromBody] CreateFlightRequest request)
    {
        var user = await CurrentUserAsync();

        var ua = await _db.UserAircraft
            .FirstOrDefaultAsync(x => x.AppUserId == user.Id && x.AircraftId == request.AircraftId);

        if (ua is null)
            return ApiError("Aircraft not found in your hangar.", HttpStatusCode.NotFound);

        var flight = new Flight
        {
            AppUserId        = user.Id,
            AircraftId       = request.AircraftId,
            Date             = request.Date,
            To               = request.To ?? string.Empty,
            From = request.From ?? string.Empty,
            Route = request.Route ?? string.Empty,
            Comment          = request.Comment ?? string.Empty,
            TotalFlightTime  = request.TotalFlightTime,
            PIC              = request.PIC ?? 0,
            SIC              = request.SIC ?? 0,
            Dual             = request.Dual ?? 0,
            CFI              = request.CFI ?? 0,
            CrossCountry     = request.CrossCountry ?? 0,
            Nighttime        = request.Nighttime ?? 0,
            IMC              = request.IMC ?? 0,
            SimulatedIFR     = request.SimulatedIFR ?? 0,
            GroundSim        = request.GroundSim ?? 0,
            Approaches       = request.Approaches ?? 0,
            Landings         = request.Landings ?? 0,
            FullStopLandings = request.FullStopLandings ?? 0,
            NightLandings    = request.NightLandings ?? 0,
            HoldingProcedures = request.HoldingProcedures ?? false,
            IsPublic         = request.IsPublic ?? false,
            HobbsStart       = request.HobbsStart,
            HobbsEnd         = request.HobbsEnd,
        };

        _db.Flights.Add(flight);
        await _db.SaveChangesAsync();

        await _db.Entry(flight).Reference(f => f.Aircraft).LoadAsync();
        await _db.Entry(flight.Aircraft).Reference(a => a.MakeModel).LoadAsync();

        return ApiOk(ToDto(flight));
    }

    // ── DELETE /api/v1/flights/{id} ───────────────────────────────────────────

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteFlight(int id)
    {
        var user   = await CurrentUserAsync();
        var flight = await _db.Flights.FindAsync(id);

        if (flight is null)
            return ApiError("Flight not found.", HttpStatusCode.NotFound);

        if (flight.AppUserId != user.Id)
            return ApiError("Not authorised to delete this flight.", HttpStatusCode.Forbidden);

        _db.Flights.Remove(flight);
        await _db.SaveChangesAsync();
        return ApiOk();
    }

    // ── POST /api/v1/flights/batch-delete ─────────────────────────────────────

    [HttpPost("batch-delete")]
    public async Task<IActionResult> BatchDelete([FromBody] BatchDeleteRequest request)
    {
        if (request.Ids is null || request.Ids.Length == 0)
            return ApiError("No flight IDs provided.");

        var user = await CurrentUserAsync();

        var flights = await _db.Flights
            .Where(f => request.Ids.Contains(f.Id) && f.AppUserId == user.Id)
            .ToListAsync();

        _db.Flights.RemoveRange(flights);
        await _db.SaveChangesAsync();

        return ApiOk(new { deleted = flights.Count });
    }

    // ── DTO projection ────────────────────────────────────────────────────────

    private static object ToDto(Flight f) => new
    {
        id                = f.Id,
        date              = f.Date,
        aircraftId        = f.AircraftId,
        tailNumber        = f.Aircraft?.TailNumber,
        modelDisplay      = f.Aircraft?.MakeModel?.Model,
        from = f.From, to = f.To,
                comment           = f.Comment,
        totalFlightTime   = f.TotalFlightTime,
        pic               = f.PIC,
        sic               = f.SIC,
        dual              = f.Dual,
        cfi               = f.CFI,
        crossCountry      = f.CrossCountry,
        nighttime         = f.Nighttime,
        imc               = f.IMC,
        simulatedIFR      = f.SimulatedIFR,
        groundSim         = f.GroundSim,
        approaches        = f.Approaches,
        landings          = f.Landings,
        fullStopLandings  = f.FullStopLandings,
        nightLandings     = f.NightLandings,
        holdingProcedures = f.HoldingProcedures,
        hobbsStart        = f.HobbsStart,
        hobbsEnd          = f.HobbsEnd,
        engineStart       = f.EngineStart,
        engineEnd         = f.EngineEnd,
        flightStart       = f.FlightStart,
        flightEnd         = f.FlightEnd,
        isPublic          = f.IsPublic,
        catClassOverride  = f.CatClassOverride,
        flightColorHex    = f.FlightColorHex,
        properties        = f.Properties?.Select(p => new
        {
            id             = p.Id,
            propertyTypeId = p.PropertyTypeId,
            caption        = p.PropertyType?.Title,
            kind           = p.PropertyType?.Kind.ToString(),
            intValue       = p.IntValue,
            decValue       = p.DecValue,
            dateValue      = p.DateValue,
            textValue      = p.TextValue
        })
    };
}

public record BatchDeleteRequest(int[] Ids);

public record CreateFlightRequest(
    DateTime Date,
    int AircraftId,
    string? Route,
    string? From,
    string? To,
    string? Comment,
    decimal TotalFlightTime,
    decimal? PIC,
    decimal? SIC,
    decimal? Dual,
    decimal? CFI,
    decimal? CrossCountry,
    decimal? Nighttime,
    decimal? IMC,
    decimal? SimulatedIFR,
    decimal? GroundSim,
    int? Approaches,
    int? Landings,
    int? FullStopLandings,
    int? NightLandings,
    bool? HoldingProcedures,
    bool? IsPublic,
    decimal? HobbsStart,
    decimal? HobbsEnd);
