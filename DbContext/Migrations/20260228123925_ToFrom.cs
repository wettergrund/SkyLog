using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyFlightbook.Api.Migrations
{
    /// <inheritdoc />
    public partial class ToFrom : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "From",
                table: "flights",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "To",
                table: "flights",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "From",
                table: "flights");

            migrationBuilder.DropColumn(
                name: "To",
                table: "flights");
        }
    }
}
