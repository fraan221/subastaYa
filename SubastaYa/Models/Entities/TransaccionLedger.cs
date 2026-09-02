using SubastaYa.Models.Enums;

namespace SubastaYa.Models.Entities;

public class TransaccionLedger
{
    public int Id { get; set; }
    public int BilleteraId { get; set; }
    public TipoTransaccion Tipo { get; set; }
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public int? SubastaId { get; set; }

    public Billetera Billetera { get; set; } = null!;
    public Subasta? Subasta { get; set; } = null!;
}
