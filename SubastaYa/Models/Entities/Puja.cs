namespace SubastaYa.Models.Entities;

public class Puja
{
    public int id { get; set; }
    public int subasta_id { get; set; }
    public int comprador_id { get; set; }
    public decimal monto { get; set; }
    public DateTime fecha_puja { get; set; }
}
