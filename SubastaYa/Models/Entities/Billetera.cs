namespace SubastaYa.Models.Entities;

public class Billetera
{
    public int id { get; set; }
    public int usuario_id { get; set; }
    public decimal saldo_total { get; set; }
    public decimal saldo_retenido { get; set; }
    public decimal saldo_disponible { get; set; }
    public int version { get; set; }
}
