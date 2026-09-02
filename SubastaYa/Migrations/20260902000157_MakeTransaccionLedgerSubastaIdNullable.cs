using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SubastaYa.Migrations
{
    /// <inheritdoc />
    public partial class MakeTransaccionLedgerSubastaIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "subasta_id",
                table: "transaccion_ledger",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "subasta_id",
                table: "transaccion_ledger",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
