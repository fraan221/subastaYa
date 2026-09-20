using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

public interface IActivitiesService
{
    Task<PaginacionResponse<MiPujaActividadResponse>> ObtenerMisPujasAsync(
        int usuarioId,
        int pagina,
        int tamaño);

    Task<PaginacionResponse<MiPublicacionActividadResponse>> ObtenerMisPublicacionesAsync(
        int usuarioId,
        int pagina,
        int tamaño);
}
