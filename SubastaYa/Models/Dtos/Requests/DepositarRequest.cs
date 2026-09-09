namespace SubastaYa.Models.Dtos.Requests;

public class DepositarRequest
{
    public int UsuarioId { get; set; }
    public decimal Monto { get; set; }
}