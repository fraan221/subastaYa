using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface IActivitiesRepository
{
    Task<(List<Subasta> Items, int TotalCount)> ObtenerSubastasConMisPujasAsync(
        int usuarioId,
        int pagina,
        int tamaño);

    Task<(List<Subasta> Items, int TotalCount)> ObtenerMisPublicacionesAsync(
        int usuarioId,
        int pagina,
        int tamaño);
}
