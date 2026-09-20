namespace SubastaYa.Models.Dtos.Responses;

public class PujaHistorialResponse
{
    public int PujaId { get; set; }
    public int SubastaId { get; set; }
    public int CompradorId { get; set; }
    public string CompradorSeudonimo { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime FechaPuja { get; set; }
}
