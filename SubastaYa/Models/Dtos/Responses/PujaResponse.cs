namespace SubastaYa.Models.Dtos.Responses;

public class PujaResponse
{
    public int PujaId { get; set; }
    public int SubastaId { get; set; }
    public int CompradorId { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaPuja { get; set; }
}