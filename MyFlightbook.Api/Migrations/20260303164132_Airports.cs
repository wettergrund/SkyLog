using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace MyFlightbook.Api.Migrations
{
    /// <inheritdoc />
    public partial class Airports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "airport",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ICAO = table.Column<string>(type: "nvarchar(14)", maxLength: 14, nullable: false),
                    IATA = table.Column<string>(type: "nvarchar(14)", maxLength: 14, nullable: false),
                    AirportType = table.Column<int>(type: "int", nullable: false),
                    LatitudeDeg = table.Column<Point>(type: "geography", nullable: true),
                    LongitudeDeg = table.Column<Point>(type: "geography", nullable: true),
                    ElevationFt = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsoCountry = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    IsoRegion = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    Municipality = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Website = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Wiki = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_airport", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "frequency",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AirportId = table.Column<int>(type: "int", nullable: false),
                    FrequencyMHz = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_frequency", x => x.Id);
                    table.ForeignKey(
                        name: "FK_frequency_airport_AirportId",
                        column: x => x.AirportId,
                        principalTable: "airport",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_airport_ICAO",
                table: "airport",
                column: "ICAO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_frequency_AirportId",
                table: "frequency",
                column: "AirportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "frequency");

            migrationBuilder.DropTable(
                name: "airport");
        }
    }
}
