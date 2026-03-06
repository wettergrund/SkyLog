using NetTopologySuite.Geometries;

namespace MyFlightbook.Data.Models.AirportDb
{
    [Table( "airport" )]
    public class Airport
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength( 14 )]
        public string ICAO { get; set; } = null!;

        [ MaxLength( 14 )]
        public string? IATA { get; set; }
        [MaxLength( 255 )]
        public string Name { get; set; }
        public AirportType AirportType { get; set; } = AirportType.Unknown;
        public Point? Location { get; set; }
        public decimal ElevationFt { get; set; }
        [MaxLength( 16 )]
        public string? IsoCountry { get; set; }
        [MaxLength( 16 )]
        public string? IsoRegion { get; set; }
        public string? Municipality { get; set; }
        public string? Website { get; set; }
        public string? Wiki { get; set; }
        public ICollection<Frequency> Frequencies { get; set; } = new List<Frequency>();



    }


}
