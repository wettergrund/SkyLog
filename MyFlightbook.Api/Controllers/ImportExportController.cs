using System.Globalization;
using System.Net;
using System.Text;

namespace MyFlightbook.Api.Controllers;

/// <summary>
/// POST /api/v1/flights/import  — import flights from a CSV file (in-memory, no disk writes)
/// GET  /api/v1/flights/export  — export all user flights as CSV
///
/// CSV columns (case-insensitive, comma-separated):
///   Date, TailNumber, From, To, TotalFlightTime, PIC, SIC, Dual, CFI,
///   CrossCountry, Night, IMC, SimulatedIFR, GroundSim, Approaches, Landings,
///   FullStopLandings, NightLandings, HobbsStart, HobbsEnd,
///   EngineStart, EngineEnd, FlightStart, FlightEnd,
///   HoldingProcedures, IsPublic, Comment
///
/// Duplicate detection: a row is skipped if the user already has a flight with the
/// same From, To, EngineStart, and EngineEnd values. When EngineStart/EngineEnd
/// are absent the check falls back to From, To, and Date.
/// </summary>
[ApiController]
[Route("api/v1/flights")]
[Authorize]
public class ImportExportController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public ImportExportController(AppDbContext db, IUserResolver resolver) : base(resolver)
        => _db = db;

    // ── POST /api/v1/flights/import ───────────────────────────────────────────

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportFlights(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return ApiError("No file provided.");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return ApiError("Only .csv files are supported.");

        var user = await CurrentUserAsync();

        // Load all user aircraft (tail number → aircraft id lookup, mutable so we can add during import)
        var userAircraft = await _db.UserAircraft
            .Where(ua => ua.AppUserId == user.Id)
            .Include(ua => ua.Aircraft)
            .ToListAsync();

        var tailLookup = userAircraft
            .ToDictionary(ua => ua.Aircraft.TailNumber.ToUpperInvariant(), ua => ua.AircraftId);

        // Pre-fetch the first available CategoryClassId for placeholder aircraft
        var defaultCategoryClassId = await _db.CategoryClasses
            .OrderBy(c => c.Id)
            .Select(c => c.Id)
            .FirstOrDefaultAsync();

        // Load existing flights for duplicate detection (only columns needed)
        var existing = await _db.Flights
            .Where(f => f.AppUserId == user.Id)
            .Select(f => new ExistingFlight(f.From, f.To, f.EngineStart, f.EngineEnd, f.Date))
            .ToListAsync();

        var existingSet = existing.ToHashSet(ExistingFlightComparer.Instance);

        // Parse CSV entirely in memory
        List<FlightCsvRow> rows;
        using (var stream = file.OpenReadStream())
        using (var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true))
        {
            rows = ParseCsv(reader);
        }

        if (rows.Count == 0)
            return ApiError("CSV file contained no data rows.");

        var imported = 0;
        var skipped  = 0;
        var errors   = new List<string>();

        foreach (var (row, idx) in rows.Select((r, i) => (r, i + 2))) // 1-based, row 1 = header
        {
            // Resolve or auto-create aircraft by tail number
            var tailKey = row.TailNumber?.Trim().ToUpperInvariant() ?? "";

            if (string.IsNullOrEmpty(tailKey))
            {
                errors.Add($"Row {idx}: missing tail number — skipped.");
                skipped++;
                continue;
            }

            if (!tailLookup.TryGetValue(tailKey, out var aircraftId))
            {
                aircraftId = await FindOrCreateAircraftAsync(user.Id, tailKey, defaultCategoryClassId);
                tailLookup[tailKey] = aircraftId;
            }

            if (!DateTime.TryParse(row.Date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                errors.Add($"Row {idx}: invalid date '{row.Date}' — skipped.");
                skipped++;
                continue;
            }

            // Duplicate detection
            var candidate = new ExistingFlight(
                row.From ?? string.Empty,
                row.To   ?? string.Empty,
                row.EngineStart,
                row.EngineEnd,
                date);

            if (existingSet.Contains(candidate))
            {
                errors.Add($"Row {idx}: duplicate flight ({row.From} → {row.To} on {date:yyyy-MM-dd}) — skipped.");
                skipped++;
                continue;
            }

            var flight = new Flight
            {
                AppUserId        = user.Id,
                AircraftId       = aircraftId,
                Date             = date,
                From             = row.From             ?? string.Empty,
                To               = row.To               ?? string.Empty,
                Comment          = row.Comment          ?? string.Empty,
                TotalFlightTime  = row.TotalFlightTime,
                PIC              = row.PIC              ?? 0,
                SIC              = row.SIC              ?? 0,
                Dual             = row.Dual             ?? 0,
                CFI              = row.CFI              ?? 0,
                CrossCountry     = row.CrossCountry     ?? 0,
                Nighttime        = row.Night            ?? 0,
                IMC              = row.IMC              ?? 0,
                SimulatedIFR     = row.SimulatedIFR     ?? 0,
                GroundSim        = row.GroundSim        ?? 0,
                Approaches       = row.Approaches       ?? 0,
                Landings         = row.Landings         ?? 0,
                FullStopLandings = row.FullStopLandings ?? 0,
                NightLandings    = row.NightLandings    ?? 0,
                HoldingProcedures = row.HoldingProcedures ?? false,
                IsPublic         = row.IsPublic         ?? false,
                HobbsStart       = row.HobbsStart,
                HobbsEnd         = row.HobbsEnd,
                EngineStart      = row.EngineStart,
                EngineEnd        = row.EngineEnd,
                FlightStart      = row.FlightStart,
                FlightEnd        = row.FlightEnd,
            };

            _db.Flights.Add(flight);

            // Add to existingSet so within-file duplicates are also caught
            existingSet.Add(candidate);
            imported++;
        }

        if (imported > 0)
            await _db.SaveChangesAsync();

        return ApiOk(new { imported, skipped, errors });
    }

    // ── Aircraft find-or-create helper ───────────────────────────────────────

    /// <summary>
    /// Returns the AircraftId for <paramref name="tailUpper"/>, creating the
    /// Aircraft and UserAircraft records if they don't already exist.
    /// Unknown aircraft are given a placeholder "Unknown" manufacturer/model
    /// that the user can update later.
    /// </summary>
    private async Task<int> FindOrCreateAircraftAsync(int userId, string tailUpper, int defaultCategoryClassId)
    {
        // 1. Check if the aircraft already exists globally (another user may have added it)
        var aircraft = await _db.Aircraft
            .FirstOrDefaultAsync(a => a.TailNumber == tailUpper);

        if (aircraft is null)
        {
            // 2. Find or create the "Unknown" placeholder manufacturer
            var manufacturer = await _db.Manufacturers
                .FirstOrDefaultAsync(m => m.ManufacturerName == "Unknown");

            if (manufacturer is null)
            {
                manufacturer = new Manufacturer { ManufacturerName = "Unknown" };
                _db.Manufacturers.Add(manufacturer);
                await _db.SaveChangesAsync();
            }

            // 3. Create a placeholder MakeModel
            var makeModel = new MakeModel
            {
                ManufacturerId  = manufacturer.Id,
                CategoryClassId = defaultCategoryClassId,
                Model           = "Unknown",
            };
            _db.MakeModels.Add(makeModel);
            await _db.SaveChangesAsync();

            // 4. Create the Aircraft
            aircraft = new Aircraft
            {
                TailNumber  = tailUpper,
                MakeModelId = makeModel.Id,
            };
            _db.Aircraft.Add(aircraft);
            await _db.SaveChangesAsync();
        }

        // 5. Link to user's hangar if not already there
        var ua = await _db.UserAircraft
            .FirstOrDefaultAsync(x => x.AppUserId == userId && x.AircraftId == aircraft.Id);

        if (ua is null)
        {
            ua = new UserAircraft { AppUserId = userId, AircraftId = aircraft.Id };
            _db.UserAircraft.Add(ua);
            await _db.SaveChangesAsync();
        }

        return aircraft.Id;
    }

    // ── GET /api/v1/flights/export ────────────────────────────────────────────

    [HttpGet("export")]
    public async Task<IActionResult> ExportFlights()
    {
        var user = await CurrentUserAsync();

        var flights = await _db.Flights
            .Where(f => f.AppUserId == user.Id)
            .Include(f => f.Aircraft)
            .OrderByDescending(f => f.Date)
            .ToListAsync();

        var sb = new StringBuilder();

        // Header
        sb.AppendLine("Date,TailNumber,From,To,TotalFlightTime,PIC,SIC,Dual,CFI," +
                      "CrossCountry,Night,IMC,SimulatedIFR,GroundSim,Approaches,Landings," +
                      "FullStopLandings,NightLandings,HobbsStart,HobbsEnd," +
                      "EngineStart,EngineEnd,FlightStart,FlightEnd," +
                      "HoldingProcedures,IsPublic,Comment");

        foreach (var f in flights)
        {
            sb.AppendLine(string.Join(",",
                Csv(f.Date.ToString("yyyy-MM-dd")),
                Csv(f.Aircraft?.TailNumber),
                Csv(f.From),
                Csv(f.To),
                f.TotalFlightTime,
                f.PIC,
                f.SIC,
                f.Dual,
                f.CFI,
                f.CrossCountry,
                f.Nighttime,
                f.IMC,
                f.SimulatedIFR,
                f.GroundSim,
                f.Approaches,
                f.Landings,
                f.FullStopLandings,
                f.NightLandings,
                f.HobbsStart?.ToString(CultureInfo.InvariantCulture) ?? "",
                f.HobbsEnd?.ToString(CultureInfo.InvariantCulture) ?? "",
                f.EngineStart?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "",
                f.EngineEnd?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "",
                f.FlightStart?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "",
                f.FlightEnd?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "",
                f.HoldingProcedures ? "true" : "false",
                f.IsPublic ? "true" : "false",
                Csv(f.Comment)
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"flights_{DateTime.UtcNow:yyyyMMdd}.csv";
        return File(bytes, "text/csv", fileName);
    }

    // ── CSV helpers ───────────────────────────────────────────────────────────

    /// <summary>Wraps a string value in quotes if it contains commas, quotes, or newlines.</summary>
    private static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    private static List<FlightCsvRow> ParseCsv(StreamReader reader)
    {
        var rows = new List<FlightCsvRow>();

        var headerLine = reader.ReadLine();
        if (headerLine is null) return rows;

        var headers = SplitCsvLine(headerLine)
            .Select((h, i) => (Key: h.Trim().ToLowerInvariant(), Index: i))
            .ToDictionary(x => x.Key, x => x.Index);

        int Col(string name) => headers.TryGetValue(name, out var i) ? i : -1;

        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var cells = SplitCsvLine(line);

            string? Get(string name)
            {
                var i = Col(name);
                return i >= 0 && i < cells.Count ? cells[i].Trim() : null;
            }

            rows.Add(new FlightCsvRow
            {
                Date             = Get("date"),
                TailNumber       = Get("tailnumber"),
                From             = Get("from"),
                To               = Get("to"),
                Comment          = Get("comment"),
                TotalFlightTime  = ParseDec(Get("totalflighttime")) ?? 0,
                PIC              = ParseDec(Get("pic")),
                SIC              = ParseDec(Get("sic")),
                Dual             = ParseDec(Get("dual")),
                CFI              = ParseDec(Get("cfi")),
                CrossCountry     = ParseDec(Get("crosscountry")),
                Night            = ParseDec(Get("night")),
                IMC              = ParseDec(Get("imc")),
                SimulatedIFR     = ParseDec(Get("simulatedifr")),
                GroundSim        = ParseDec(Get("groundsim")),
                Approaches       = ParseInt(Get("approaches")),
                Landings         = ParseInt(Get("landings")),
                FullStopLandings = ParseInt(Get("fullstoplandings")),
                NightLandings    = ParseInt(Get("nightlandings")),
                HobbsStart       = ParseDec(Get("hobbsstart")),
                HobbsEnd         = ParseDec(Get("hobbsend")),
                EngineStart      = ParseDateTime(Get("enginestart")),
                EngineEnd        = ParseDateTime(Get("engineend")),
                FlightStart      = ParseDateTime(Get("flightstart")),
                FlightEnd        = ParseDateTime(Get("flightend")),
                HoldingProcedures = ParseBool(Get("holdingprocedures")),
                IsPublic         = ParseBool(Get("ispublic")),
            });
        }

        return rows;
    }

    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var sb     = new StringBuilder();
        var inQuote = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (inQuote)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        sb.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuote = false;
                    }
                }
                else
                {
                    sb.Append(c);
                }
            }
            else
            {
                if (c == '"')
                {
                    inQuote = true;
                }
                else if (c == ',')
                {
                    result.Add(sb.ToString());
                    sb.Clear();
                }
                else
                {
                    sb.Append(c);
                }
            }
        }

        result.Add(sb.ToString());
        return result;
    }

    private static decimal? ParseDec(string? s) =>
        decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : null;

    private static int? ParseInt(string? s) =>
        int.TryParse(s, out var v) ? v : null;

    private static DateTime? ParseDateTime(string? s) =>
        DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var v) ? v : null;

    private static bool? ParseBool(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        return s.ToLowerInvariant() is "true" or "1" or "yes";
    }

    // ── Private types ─────────────────────────────────────────────────────────

    private sealed record ExistingFlight(string From, string To, DateTime? EngineStart, DateTime? EngineEnd, DateTime Date);

    private sealed class ExistingFlightComparer : IEqualityComparer<ExistingFlight>
    {
        public static readonly ExistingFlightComparer Instance = new();

        public bool Equals(ExistingFlight? x, ExistingFlight? y)
        {
            if (x is null || y is null) return false;

            var fromEq = string.Equals(x.From, y.From, StringComparison.OrdinalIgnoreCase);
            var toEq   = string.Equals(x.To,   y.To,   StringComparison.OrdinalIgnoreCase);

            if (!fromEq || !toEq) return false;

            // If both have engine times, use them for the check
            if (x.EngineStart.HasValue && y.EngineStart.HasValue &&
                x.EngineEnd.HasValue   && y.EngineEnd.HasValue)
            {
                return x.EngineStart == y.EngineStart && x.EngineEnd == y.EngineEnd;
            }

            // Fall back to date only
            return x.Date.Date == y.Date.Date;
        }

        public int GetHashCode(ExistingFlight obj)
        {
            var fromHash = obj.From?.ToUpperInvariant()?.GetHashCode() ?? 0;
            var toHash   = obj.To?.ToUpperInvariant()?.GetHashCode() ?? 0;

            var timeHash = (obj.EngineStart.HasValue && obj.EngineEnd.HasValue)
                ? HashCode.Combine(obj.EngineStart, obj.EngineEnd)
                : obj.Date.Date.GetHashCode();

            return HashCode.Combine(fromHash, toHash, timeHash);
        }
    }

    private sealed class FlightCsvRow
    {
        public string? Date             { get; set; }
        public string? TailNumber       { get; set; }
        public string? From             { get; set; }
        public string? To               { get; set; }
        public string? Comment          { get; set; }
        public decimal  TotalFlightTime  { get; set; }
        public decimal? PIC              { get; set; }
        public decimal? SIC              { get; set; }
        public decimal? Dual             { get; set; }
        public decimal? CFI              { get; set; }
        public decimal? CrossCountry     { get; set; }
        public decimal? Night            { get; set; }
        public decimal? IMC              { get; set; }
        public decimal? SimulatedIFR     { get; set; }
        public decimal? GroundSim        { get; set; }
        public int?     Approaches       { get; set; }
        public int?     Landings         { get; set; }
        public int?     FullStopLandings { get; set; }
        public int?     NightLandings    { get; set; }
        public decimal? HobbsStart       { get; set; }
        public decimal? HobbsEnd         { get; set; }
        public DateTime? EngineStart     { get; set; }
        public DateTime? EngineEnd       { get; set; }
        public DateTime? FlightStart     { get; set; }
        public DateTime? FlightEnd       { get; set; }
        public bool?    HoldingProcedures { get; set; }
        public bool?    IsPublic         { get; set; }
    }
}
