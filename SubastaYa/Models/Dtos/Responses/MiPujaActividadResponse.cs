namespace SubastaYa.Models.Dtos.Responses;

public class MiPujaActividadResponse
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Estado { get; set; } = string.Empty;
    public decimal MiPujaMaxima { get; set; }
    public decimal? MontoActual { get; set; }
    public int CantidadPujas { get; set; }
    public string Resultado { get; set; } = string.Empty;
}
