using System.ComponentModel.DataAnnotations;

namespace SubastaYa.Models.Entities;

public class Billetera
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public decimal SaldoTotal { get; set; }
    public decimal SaldoRetenido { get; set; }
    public decimal SaldoDisponible { get; set; }
    [ConcurrencyCheck] 
    public int Version { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
