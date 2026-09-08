using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Enums;

namespace SubastaYa.Services.Interfaces;

public interface ISubastaService
{
    Task<SubastaResponse> CrearSubastaAsync(CrearSubastaRequest request);
    Task<PaginacionResponse<SubastaListadoResponse>> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda);
    Task<SubastaDetalleResponse> ObtenerSubastaAsync(int id);
}
