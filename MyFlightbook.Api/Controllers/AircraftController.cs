using MyFlightbook.Data;

namespace MyFlightbook.Api.Controllers;

/// <summary>
/// Aircraft REST endpoints.
///
/// GET    /api/v1/aircraft             — list all aircraft in the user's hangar
/// GET    /api/v1/aircraft/{id}        — single aircraft with maintenance data
/// GET    /api/v1/aircraft/categories  — list all category/class options
/// POST   /api/v1/aircraft             — add an aircraft to the user's hangar
/// DELETE /api/v1/aircraft/{id}        — remove aircraft from the user's hangar
///                                       (does NOT delete the shared Aircraft record)
/// </summary>
[ApiController]
[Route("api/v1/aircraft")]
[Authorize]
public class AircraftController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public AircraftController(AppDbContext db, IUserResolver resolver) : base(resolver)
        => _db = db;

    // ── GET /api/v1/aircraft ──────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAircraft()
    {
        var user = await CurrentUserAsync();

        var rows = await _db.UserAircraft
            .Where(ua => ua.AppUserId == user.Id)
            .Include(ua => ua.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.Manufacturer)
            .Include(ua => ua.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.CategoryClass)
            .ToListAsync();

        return ApiOk(rows.Select(ToDto));
    }

    // ── GET /api/v1/aircraft/{id} ─────────────────────────────────────────────

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAircraft(int id)
    {
        var user = await CurrentUserAsync();

        var ua = await _db.UserAircraft
            .Where(x => x.AppUserId == user.Id && x.AircraftId == id)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.Manufacturer)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.CategoryClass)
            .FirstOrDefaultAsync();

        if (ua is null)
            return ApiError("Aircraft not found in your hangar.", HttpStatusCode.NotFound);

        return ApiOk(ToDto(ua));
    }

    // ── GET /api/v1/aircraft/categories ──────────────────────────────────────

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategoryClasses()
    {
        var cats = await _db.CategoryClasses
            .OrderBy(c => c.CatClass)
            .ToListAsync();

        return ApiOk(cats.Select(c => new { id = c.Id, catClass = c.CatClass }));
    }

    // ── POST /api/v1/aircraft ─────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreateAircraft([FromBody] CreateAircraftRequest request)
    {
        var user = await CurrentUserAsync();

        // Find or create manufacturer (case-insensitive)
        var manufacturerName = request.ManufacturerName.Trim();
        var manufacturer = await _db.Manufacturers
            .FirstOrDefaultAsync(m => m.ManufacturerName.ToLower() == manufacturerName.ToLower());

        if (manufacturer is null)
        {
            manufacturer = new Manufacturer { ManufacturerName = manufacturerName };
            _db.Manufacturers.Add(manufacturer);
            await _db.SaveChangesAsync();
        }

        // Create a new MakeModel
        var makeModel = new MakeModel
        {
            ManufacturerId  = manufacturer.Id,
            CategoryClassId = request.CategoryClassId,
            Model           = request.ModelName.Trim(),
        };
        _db.MakeModels.Add(makeModel);
        await _db.SaveChangesAsync();

        // Find or create Aircraft by tail number (shared across users)
        var tailUpper = request.TailNumber.Trim().ToUpperInvariant();
        var aircraft = await _db.Aircraft
            .FirstOrDefaultAsync(a => a.TailNumber == tailUpper);

        if (aircraft is null)
        {
            var instanceType = Enum.TryParse<AircraftInstanceType>(request.InstanceType, out var parsed)
                ? parsed
                : AircraftInstanceType.RealAircraft;

            aircraft = new Aircraft
            {
                TailNumber   = tailUpper,
                MakeModelId  = makeModel.Id,
                InstanceType = instanceType,
            };
            _db.Aircraft.Add(aircraft);
            await _db.SaveChangesAsync();
        }

        // Upsert UserAircraft
        var ua = await _db.UserAircraft
            .FirstOrDefaultAsync(x => x.AppUserId == user.Id && x.AircraftId == aircraft.Id);

        if (ua is null)
        {
            ua = new UserAircraft { AppUserId = user.Id, AircraftId = aircraft.Id };
            _db.UserAircraft.Add(ua);
            await _db.SaveChangesAsync();
        }

        // Reload with navigation properties for the DTO
        ua = await _db.UserAircraft
            .Where(x => x.AppUserId == user.Id && x.AircraftId == aircraft.Id)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.Manufacturer)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.CategoryClass)
            .FirstAsync();

        return ApiOk(ToDto(ua));
    }

    // ── PUT /api/v1/aircraft/{id} ─────────────────────────────────────────────

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAircraft(int id, [FromBody] UpdateAircraftRequest request)
    {
        var user = await CurrentUserAsync();

        var ua = await _db.UserAircraft
            .Where(x => x.AppUserId == user.Id && x.AircraftId == id)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel)
            .FirstOrDefaultAsync();

        if (ua is null)
            return ApiError("Aircraft not found in your hangar.", HttpStatusCode.NotFound);

        // Find or create the manufacturer
        var manufacturerName = request.ManufacturerName.Trim();
        var manufacturer = await _db.Manufacturers
            .FirstOrDefaultAsync(m => m.ManufacturerName.ToLower() == manufacturerName.ToLower());

        if (manufacturer is null)
        {
            manufacturer = new Manufacturer { ManufacturerName = manufacturerName };
            _db.Manufacturers.Add(manufacturer);
            await _db.SaveChangesAsync();
        }

        // Update the MakeModel in-place
        var makeModel = ua.Aircraft.MakeModel;
        makeModel.ManufacturerId  = manufacturer.Id;
        makeModel.CategoryClassId = request.CategoryClassId;
        makeModel.Model           = request.ModelName.Trim();

        // Update instance type
        if (Enum.TryParse<AircraftInstanceType>(request.InstanceType, out var instanceType))
            ua.Aircraft.InstanceType = instanceType;

        await _db.SaveChangesAsync();

        // Reload with navigation properties for the DTO
        ua = await _db.UserAircraft
            .Where(x => x.AppUserId == user.Id && x.AircraftId == id)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.Manufacturer)
            .Include(x => x.Aircraft).ThenInclude(a => a.MakeModel).ThenInclude(mm => mm.CategoryClass)
            .FirstAsync();

        return ApiOk(ToDto(ua));
    }

    // ── DELETE /api/v1/aircraft/{id} ──────────────────────────────────────────

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> RemoveAircraft(int id)
    {
        var user = await CurrentUserAsync();

        var ua = await _db.UserAircraft
            .FirstOrDefaultAsync(x => x.AppUserId == user.Id && x.AircraftId == id);

        if (ua is null)
            return ApiError("Aircraft not found in your hangar.", HttpStatusCode.NotFound);

        _db.UserAircraft.Remove(ua);
        await _db.SaveChangesAsync();
        return ApiOk();
    }

    // ── DTO projection ────────────────────────────────────────────────────────

    private static object ToDto(UserAircraft ua)
    {
        var ac    = ua.Aircraft;
        var mm    = ac?.MakeModel;
        var maint = ac?.Maintenance;

        return new
        {
            aircraftId         = ac?.Id,
            tailNumber         = ac?.TailNumber,
            instanceType       = ac?.InstanceType.ToString(),
            makeModelId        = mm?.Id,
            categoryClassId    = mm?.CategoryClassId,
            model              = mm?.Model,
            modelName          = mm?.ModelName,
            typeName           = mm?.TypeName,
            manufacturer       = mm?.Manufacturer?.ManufacturerName,
            categoryClass      = mm?.CategoryClass?.CatClass,
            icao               = ac?.ICAO,
            isGlass            = ac?.GlassUpgradeDate.HasValue,
            glassUpgradeDate   = ac?.GlassUpgradeDate,
            publicNotes        = ac?.PublicNotes,
            defaultImage       = ac?.DefaultImage,
            // User-specific configuration
            roleForPilot       = ua.RoleForPilot.ToString(),
            hideFromSelection  = ua.HideFromSelection,
            privateNotes       = ua.PrivateNotes,
            isRegistered       = ua.IsRegistered,
            avionicsTechnology = ua.AvionicsTechnology.ToString(),
            // Maintenance (only for registered aircraft)
            maintenance = ua.IsRegistered ? new
            {
                lastAnnual              = maint?.LastAnnual,
                lastTransponder         = maint?.LastTransponder,
                lastStatic              = maint?.LastStatic,
                lastAltimeter           = maint?.LastAltimeter,
                lastELT                 = maint?.LastELT,
                lastVOR                 = maint?.LastVOR,
                registrationExpiration  = maint?.RegistrationExpiration,
                last100                 = maint?.Last100,
                lastOilChange           = maint?.LastOilChange,
                lastNewEngine           = maint?.LastNewEngine,
                notes                   = maint?.Notes
            } : null
        };
    }
}

public record UpdateAircraftRequest(
    string ManufacturerName,
    string ModelName,
    int CategoryClassId,
    string? InstanceType);

public record CreateAircraftRequest(
    string TailNumber,
    string ManufacturerName,
    string ModelName,
    int CategoryClassId,
    string? InstanceType);
