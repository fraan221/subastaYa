namespace SubastaYa.Models.Dtos.Responses;

public class PaginacionResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int PaginaActual { get; set; }
    public int TamañoPagina { get; set; }
    public int TotalItems { get; set; }
    public int TotalPaginas { get; set; }
}