using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyFlightbook.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirebaseUid = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UsesHHMM = table.Column<bool>(type: "bit", nullable: false),
                    IsInstructor = table.Column<bool>(type: "bit", nullable: false),
                    PreferredTimeZoneId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CurrencyJurisdiction = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastActivity = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "category_classes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CatClass = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_category_classes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "manufacturers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ManufacturerName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_manufacturers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "property_types",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ShortTitle = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Kind = table.Column<int>(type: "int", nullable: false),
                    FormatString = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Flags = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_types", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "make_models",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ManufacturerId = table.Column<int>(type: "int", nullable: false),
                    CategoryClassId = table.Column<int>(type: "int", nullable: false),
                    Model = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ModelName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TypeName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FamilyName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ArmyMDS = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    IsComplex = table.Column<bool>(type: "bit", nullable: false),
                    IsHighPerf = table.Column<bool>(type: "bit", nullable: false),
                    Is200HP = table.Column<bool>(type: "bit", nullable: false),
                    IsTailWheel = table.Column<bool>(type: "bit", nullable: false),
                    IsRetract = table.Column<bool>(type: "bit", nullable: false),
                    IsConstantProp = table.Column<bool>(type: "bit", nullable: false),
                    HasFlaps = table.Column<bool>(type: "bit", nullable: false),
                    EngineType = table.Column<int>(type: "int", nullable: false),
                    IsMotorGlider = table.Column<bool>(type: "bit", nullable: false),
                    IsMultiEngineHelicopter = table.Column<bool>(type: "bit", nullable: false),
                    IsCertifiedSinglePilot = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_make_models", x => x.Id);
                    table.ForeignKey(
                        name: "FK_make_models_category_classes_CategoryClassId",
                        column: x => x.CategoryClassId,
                        principalTable: "category_classes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_make_models_manufacturers_ManufacturerId",
                        column: x => x.ManufacturerId,
                        principalTable: "manufacturers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aircraft",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TailNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    MakeModelId = table.Column<int>(type: "int", nullable: false),
                    InstanceType = table.Column<int>(type: "int", nullable: false),
                    IsLocked = table.Column<bool>(type: "bit", nullable: false),
                    PublicNotes = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    DefaultImage = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ICAO = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                    GlassUpgradeDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Revision = table.Column<int>(type: "int", nullable: false),
                    Maintenance_LastAnnual = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_LastTransponder = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_LastStatic = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_LastAltimeter = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_LastELT = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_LastVOR = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_RegistrationExpiration = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Maintenance_Last100 = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    Maintenance_LastOilChange = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    Maintenance_LastNewEngine = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    Maintenance_Notes = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aircraft", x => x.Id);
                    table.ForeignKey(
                        name: "FK_aircraft_make_models_MakeModelId",
                        column: x => x.MakeModelId,
                        principalTable: "make_models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "flights",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    AircraftId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Route = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: false),
                    TotalFlightTime = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    PIC = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    SIC = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    Dual = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    CFI = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    CrossCountry = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    Nighttime = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    IMC = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    SimulatedIFR = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    GroundSim = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    Approaches = table.Column<int>(type: "int", nullable: false),
                    Landings = table.Column<int>(type: "int", nullable: false),
                    FullStopLandings = table.Column<int>(type: "int", nullable: false),
                    NightLandings = table.Column<int>(type: "int", nullable: false),
                    HoldingProcedures = table.Column<bool>(type: "bit", nullable: false),
                    HobbsStart = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: true),
                    HobbsEnd = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: true),
                    EngineStart = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EngineEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FlightStart = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FlightEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    CatClassOverride = table.Column<int>(type: "int", nullable: false),
                    FlightColorHex = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_flights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_flights_aircraft_AircraftId",
                        column: x => x.AircraftId,
                        principalTable: "aircraft",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_flights_app_users_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "app_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_aircraft",
                columns: table => new
                {
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    AircraftId = table.Column<int>(type: "int", nullable: false),
                    RoleForPilot = table.Column<int>(type: "int", nullable: false),
                    HideFromSelection = table.Column<bool>(type: "bit", nullable: false),
                    PrivateNotes = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    IsRegistered = table.Column<bool>(type: "bit", nullable: false),
                    AvionicsTechnology = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_aircraft", x => new { x.AppUserId, x.AircraftId });
                    table.ForeignKey(
                        name: "FK_user_aircraft_aircraft_AircraftId",
                        column: x => x.AircraftId,
                        principalTable: "aircraft",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_aircraft_app_users_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "app_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "flight_properties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FlightId = table.Column<int>(type: "int", nullable: false),
                    PropertyTypeId = table.Column<int>(type: "int", nullable: false),
                    IntValue = table.Column<int>(type: "int", nullable: false),
                    DecValue = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    DateValue = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TextValue = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_flight_properties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_flight_properties_flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "flights",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_flight_properties_property_types_PropertyTypeId",
                        column: x => x.PropertyTypeId,
                        principalTable: "property_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_aircraft_MakeModelId",
                table: "aircraft",
                column: "MakeModelId");

            migrationBuilder.CreateIndex(
                name: "IX_app_users_Email",
                table: "app_users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_users_FirebaseUid",
                table: "app_users",
                column: "FirebaseUid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_flight_properties_FlightId",
                table: "flight_properties",
                column: "FlightId");

            migrationBuilder.CreateIndex(
                name: "IX_flight_properties_PropertyTypeId",
                table: "flight_properties",
                column: "PropertyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_flights_AircraftId",
                table: "flights",
                column: "AircraftId");

            migrationBuilder.CreateIndex(
                name: "IX_flights_AppUserId",
                table: "flights",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_make_models_CategoryClassId",
                table: "make_models",
                column: "CategoryClassId");

            migrationBuilder.CreateIndex(
                name: "IX_make_models_ManufacturerId",
                table: "make_models",
                column: "ManufacturerId");

            migrationBuilder.CreateIndex(
                name: "IX_user_aircraft_AircraftId",
                table: "user_aircraft",
                column: "AircraftId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "flight_properties");

            migrationBuilder.DropTable(
                name: "user_aircraft");

            migrationBuilder.DropTable(
                name: "flights");

            migrationBuilder.DropTable(
                name: "property_types");

            migrationBuilder.DropTable(
                name: "aircraft");

            migrationBuilder.DropTable(
                name: "app_users");

            migrationBuilder.DropTable(
                name: "make_models");

            migrationBuilder.DropTable(
                name: "category_classes");

            migrationBuilder.DropTable(
                name: "manufacturers");
        }
    }
}
