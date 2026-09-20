namespace SubastaYa.Models.Dtos.Responses;

public class MiPublicacionActividadResponse
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Estado { get; set; } = string.Empty;
    public int CantidadPujas { get; set; }
    public decimal? MontoActual { get; set; }
    public decimal? MontoAdjudicado { get; set; }
    public decimal Recaudacion { get; set; }
    public string? GanadorNombre { get; set; }
    public string EstadoAdjudicacion { get; set; } = string.Empty;
}
