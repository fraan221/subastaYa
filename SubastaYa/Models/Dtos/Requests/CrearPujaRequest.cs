using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Models.Dtos.Requests;

public class CrearPujaRequest
{
    public int CompradorId { get; set; }

    [Required(ErrorMessage = "El monto de la puja es obligatorio.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto de la puja debe ser mayor a 0.")]
    public decimal Monto { get; set; }
}
