using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Models.Dtos.Requests;

public class CrearSubastaRequest
{
    [Required(ErrorMessage = "El ID del vendedor es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "El ID del vendedor debe ser mayor a 0.")]
    public int VendedorId { get; set; }

    [Required(ErrorMessage = "El ID de la categoría es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "El ID de la categoría debe ser mayor a 0.")]
    public int CategoriaId { get; set; }

    [Required(ErrorMessage = "El título es obligatorio.")]
    [MaxLength(200, ErrorMessage = "El título no puede superar los 200 caracteres.")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La descripción es obligatoria.")]
    [MaxLength(1000, ErrorMessage = "La descripción no puede superar los 1000 caracteres.")]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "La URL de la imagen es obligatoria.")]
    [MaxLength(255, ErrorMessage = "La URL de la imagen no puede superar los 255 caracteres.")]
    public string UrlImagen { get; set; } = string.Empty;

    [Required(ErrorMessage = "El precio base es obligatorio.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "El precio base debe ser mayor a 0.")]
    public decimal PrecioBase { get; set; }

    [Required(ErrorMessage = "El incremento mínimo es obligatorio.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "El incremento mínimo debe ser mayor a 0.")]
    public decimal IncrementoMinimo { get; set; }

    [Required(ErrorMessage = "La fecha de inicio es obligatoria.")]
    public DateTime FechaInicio { get; set; }

    [Required(ErrorMessage = "La fecha de fin es obligatoria.")]
    public DateTime FechaFin { get; set; }
}
