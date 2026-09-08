namespace SubastaYa.Models.Dtos.Responses;

public class SubastaDetalleResponse
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;
    public decimal PrecioBase { get; set; }
    public decimal IncrementoMinimo { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string Estado { get; set; } = string.Empty;
    public int Version { get; set; }
    public string VendedorNombre { get; set; } = string.Empty;
    public string CategoriaNombre { get; set; } = string.Empty;
    public int CantidadPujas { get; set; }
    public decimal? MontoActual { get; set; }
    public string? UltimaPujaComprador { get; set; }
    public DateTime? FechaUltimaPuja { get; set; }
}