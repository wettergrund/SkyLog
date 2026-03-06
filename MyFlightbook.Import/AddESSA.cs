using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyFlightbook.Data;
using MyFlightbook.Data.Models;
using MyFlightbook.Data.Models.AirportDb;
using NetTopologySuite.Geometries;
using System.Globalization;
using System.Text.RegularExpressions;

namespace MyFlightbook.Import;

public class AddESSA
{
    private readonly ILogger<AddESSA> _logger;
    private readonly AppDbContext _db;

    public AddESSA(ILogger<AddESSA> logger, AppDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [Function( "AddESSA" )]
    public IActionResult Run([HttpTrigger( AuthorizationLevel.Function, "get", "post" )] HttpRequest req)
    {
        _logger.LogInformation( "C# HTTP trigger function processed a request." );

        var ap = new Airport()
        {

            IATA = "ARN",
            ICAO = "ESSA",
            Name = "Stockholm-Arlanda Airport",
            AirportType = Data.Models.AirportType.Large,
            Location = new Point( 17.9186, 17.928829 ) { SRID = 4326 },
            ElevationFt = 137.0m,
            IsoCountry = "SE",
            IsoRegion = "SE-AB",
            Municipality = "Stockholm",
            Website = "https://www.swedavia.com/arlanda-airport/",
            Wiki = "https://en.wikipedia.org/wiki/Stockholm-Arlanda_Airport"




        };

        _db.Airports.Add( ap );
        _db.SaveChanges();

        return new OkObjectResult( "Welcome to Azure Functions!" );
    }

    [Function( "AddAll" )]
    public async Task<IActionResult> RunAll([HttpTrigger( AuthorizationLevel.Function, "get", "post" )] HttpRequest req)
    {
        _logger.LogInformation( "C# HTTP trigger function processed a request." );

        // 1. Fetch existing airports into a Dictionary for O(1) lookup
        // We only select the properties needed for comparison to save memory
        var existingAirports = await _db.Airports
            .ToDictionaryAsync( a => a.ICAO, a => a );

        var csvLines = await File.ReadAllLinesAsync( "airports.csv" );
        var sortedLines = csvLines.Skip( 1 )
            .OrderByDescending( l => l.Contains( "large_airport" ) )
            .ThenByDescending( l => l.Contains( "medium_airport" ) )
            .ThenBy( l => l.Contains( "closed" ) );

        var seenIcaos = new HashSet<string>();
        var toUpdate = new List<Airport>();
        var toAdd = new List<Airport>();

        foreach (var line in sortedLines.Where( l => !string.IsNullOrWhiteSpace( l ) ))
        {
            var imported = MapCsvToAirport( line );
            if (string.IsNullOrWhiteSpace( imported.ICAO ) || seenIcaos.Contains( imported.ICAO ))
            {
                continue;
            }
            if (existingAirports.TryGetValue( imported.ICAO, out var existing ))
            {
                // 2. Check for differences
                if (HasChanged( existing, imported ))
                {
                    // Update the existing entity (EF tracks these changes)
                    existing.Name = imported.Name;
                    existing.ElevationFt = imported.ElevationFt;
                    existing.Municipality = imported.Municipality;
                    existing.Location = imported.Location;
                    // ... map other fields ...

                    toUpdate.Add( existing );
                }
            }
            else
            {
                toAdd.Add( imported );
            }
            seenIcaos.Add( imported.ICAO );
        }

        // 3. Save changes in batches
        if (toAdd.Any()) _db.Airports.AddRange( toAdd );
        await _db.SaveChangesAsync();
        return new OkObjectResult( "Welcome to Azure Functions!" );

    }

    // Helper to determine if an update is actually needed
    private bool HasChanged(Airport existing, Airport imported)
    {
        return existing.Name != imported.Name ||
               existing.ElevationFt != imported.ElevationFt ||
               existing.Municipality != imported.Municipality ||
               !existing.Location.EqualsExact( imported.Location );
    }


    public Airport MapCsvToAirport(string csvLine)
    {
        // Regex to split by comma but ignore commas inside double quotes
        var columns = Regex.Matches( csvLine, @"(?<=^|,)(?:""(?<val>[^""]*?)""|(?<val>[^,]*))" )
                           .Cast<Match>()
                           .Select( m => m.Groups["val"].Value )
                           .ToArray();

        // Mapping based on the OurAirports CSV header indexes
        return new Airport
        {
            Name = columns[3],
            AirportType = MapType( columns[2] ),
            // OurAirports is [Latitude, Longitude], Point is [X (Long), Y (Lat)]
            Location = new Point( double.Parse( columns[5], CultureInfo.InvariantCulture ), double.Parse( columns[4], CultureInfo.InvariantCulture ) ) { SRID = 4326 },
            ElevationFt = decimal.TryParse( columns[6], out var el ) ? el : 0,
            IsoCountry = columns[8],
            IsoRegion = columns[9],
            Municipality = columns[10],
            IATA = string.IsNullOrEmpty( columns[13] ) ? null : columns[13],
            ICAO = string.IsNullOrEmpty( columns[12] ) ? columns[1] : columns[12], // Use ident if icao is blank
            Website = columns[16],
            Wiki = columns[17]
        };
    }

    private Data.Models.AirportType MapType(string type) => type switch
    {
        "large_airport" => Data.Models.AirportType.Large,
        "medium_airport" => Data.Models.AirportType.Medium,
        "small_airport" => AirportType.Small,
        "heliport" => AirportType.Heliport,
        _ => Data.Models.AirportType.Small // Default for heliports, closed, etc.
    };
}