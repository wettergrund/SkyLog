namespace MyFlightbook.Data.Models.AirportDb
{
    [Table( "frequency" )]
    public class Frequency
    {
    [Key]
        public int Id { get; set; }
        public int AirportId { get; set; }
        public Airport Airport { get; set; } = null!;
        public decimal FrequencyMHz { get; set; }
        [MaxLength( 255 )]
        public string? Description { get; set; }
    }
}
