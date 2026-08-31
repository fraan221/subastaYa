using System.ComponentModel.DataAnnotations;
using SubastaYa.Models.Enums;

namespace SubastaYa.Models.Entities;

public class Subasta
{
    public int Id { get; set; }
    public int VendedorId { get; set; }
    public int CategoriaId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;
    public decimal PrecioBase { get; set; }
    public decimal IncrementoMinimo { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    public EstadoSubasta Estado;
    [ConcurrencyCheck]
    public int Version { get; set; }

    public Usuario Vendedor { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public ICollection<Puja> Pujas { get; set; } = null!;
}
