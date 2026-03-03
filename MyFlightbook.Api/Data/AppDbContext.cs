namespace MyFlightbook.Api.Data;

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

        // ── Enum → int storage ────────────────────────────────────────────────
        mb.Entity<Aircraft>()
            .Property(a => a.InstanceType).HasConversion<int>();

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
