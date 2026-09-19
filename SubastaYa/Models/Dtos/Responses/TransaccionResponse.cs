namespace SubastaYa.Models.Dtos.Responses;

public class TransaccionResponse
{
    public int Id { get; set; }
    public int BilleteraId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public int? SubastaId { get; set; }
    public string? SubastaTitulo { get; set; }
}
