namespace SubastaYa.Models.Entities;

public class Transaccion_Ledger
{
    public int id { get; set; }
    public int billetera_id { get; set; }
    public string tipo { get; set; } = string.Empty;
    public decimal monto { get; set; }
    public DateTime fecha { get; set; }
    public int subasta_id { get; set; }
}
