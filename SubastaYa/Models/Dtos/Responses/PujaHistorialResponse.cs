namespace SubastaYa.Models.Dtos.Responses;

/// <summary>
/// Representa una puja individual dentro del historial cronológico de la sala de subasta en vivo.
/// Contiene el monto ofertado, el seudónimo anonimizado del comprador y la marca temporal exacta.
/// </summary>
public class PujaHistorialResponse
{
    public int PujaId { get; set; }
    public int SubastaId { get; set; }
    public int CompradorId { get; set; }
    public string CompradorSeudonimo { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime FechaPuja { get; set; }
}
