namespace SubastaYa.Models.Dtos.Responses;

public class BalanceResponse
{
    public int UsuarioId  { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public decimal SaldoTotal { get; set; }
    public decimal SaldoRetenido { get; set; }
    public decimal SaldoDisponible { get; set; }
}