


using MyFlightbook.Data.Models;
using MyFlightbook.Data.Models.AirportDb;

namespace MyFlightbook.Data.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Flight> Flights => Set<Flight>();
    public DbSet<Aircraft> Aircraft => Set<Aircraft>();
    public DbSet<MakeModel> MakeModels => Set<MakeModel>();
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<CategoryClass> CategoryClasses => Set<CategoryClass>();
    public DbSet<UserAircraft> UserAircraft => Set<UserAircraft>();
    public DbSet<PropertyType> PropertyTypes => Set<PropertyType>();
    public DbSet<FlightProperty> FlightProperties => Set<FlightProperty>();
    public DbSet<Airport> Airports => Set<Airport>();
    public DbSet<Frequency> Frequencies => Set<Frequency>();


    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ── AppUser ───────────────────────────────────────────────────────────
        mb.Entity<AppUser>()
            .HasIndex(u => u.FirebaseUid).IsUnique();

        mb.Entity<AppUser>()
            .HasIndex(u => u.Email).IsUnique();

        // ── UserAircraft — composite PK ───────────────────────────────────────
        mb.Entity<UserAircraft>()
            .HasKey(ua => new { ua.AppUserId, ua.AircraftId });

        mb.Entity<UserAircraft>()
            .HasOne(ua => ua.User)
            .WithMany(u => u.UserAircraft)
            .HasForeignKey(ua => ua.AppUserId);

        mb.Entity<UserAircraft>()
            .HasOne(ua => ua.Aircraft)
            .WithMany(a => a.UserAircraft)
            .HasForeignKey(ua => ua.AircraftId);

        // ── Aircraft — owned maintenance entity ───────────────────────────────
        mb.Entity<Aircraft>().OwnsOne(a => a.Maintenance, m =>
        {
            m.Property(x => x.Last100).HasPrecision(8, 2);
            m.Property(x => x.LastOilChange).HasPrecision(8, 2);
            m.Property(x => x.LastNewEngine).HasPrecision(8, 2);
        });
        // Airport
        mb.Entity<Airport>()
            .HasIndex(a => a.ICAO).IsUnique();
        // For Airport Elevation (e.g., 12345.67)
        mb.Entity<Airport>()
            .Property( a => a.ElevationFt )
            .HasPrecision( 18, 2 );

        // For Frequency (e.g., 128.550 or 1090.000)
        mb.Entity<Frequency>()
            .Property( f => f.FrequencyMHz )
            .HasPrecision( 18, 3 ); // 3 decimal places is common for aviation frequencies

        // ── Enum → int storage ────────────────────────────────────────────────
        mb.Entity<Aircraft>()
            .Property(a => a.InstanceType).HasConversion<int>();
            mb.Entity<Airport>().Property(a => a.AirportType).HasConversion<int>();

        mb.Entity<UserAircraft>()
            .Property(ua => ua.RoleForPilot).HasConversion<int>();

        mb.Entity<UserAircraft>()
            .Property(ua => ua.AvionicsTechnology).HasConversion<int>();

        mb.Entity<MakeModel>()
            .Property(m => m.EngineType).HasConversion<int>();

        mb.Entity<PropertyType>()
            .Property(p => p.Kind).HasConversion<int>();
    }
}
