namespace SubastaYa.Models.Dtos.Responses;

public class SubastaListadoResponse
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;
    public decimal PrecioBase { get; set; }
    public DateTime FechaFin { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public int CantidadPujas { get; set; }
    public decimal? MontoActual { get; set; }
}
