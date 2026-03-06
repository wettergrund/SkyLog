using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace MyFlightbook.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LatitudeDeg",
                table: "airport");

            migrationBuilder.RenameColumn(
                name: "LongitudeDeg",
                table: "airport",
                newName: "Location");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Location",
                table: "airport",
                newName: "LongitudeDeg");

            migrationBuilder.AddColumn<Point>(
                name: "LatitudeDeg",
                table: "airport",
                type: "geography",
                nullable: true);
        }
    }
}
