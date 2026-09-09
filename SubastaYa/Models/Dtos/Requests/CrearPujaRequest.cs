using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Models.Dtos.Requests;

public class CrearPujaRequest
{
    [Required(ErrorMessage = "El ID del comprador es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "El ID del comprador debe ser mayor a 0.")]
    public int CompradorId { get; set; }

    [Required(ErrorMessage = "El monto de la puja es obligatorio.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto de la puja debe ser mayor a 0.")]
    public decimal Monto { get; set; }
}
