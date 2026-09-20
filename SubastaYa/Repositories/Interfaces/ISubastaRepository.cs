using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;

namespace SubastaYa.Repositories.Interfaces;

public interface ISubastaRepository
{
    Task<bool> ExisteUsuarioAsync(int usuarioId);
    Task<bool> ExisteCategoriaAsync(int categoriaId);
    void AgregarSubasta(Subasta subasta);
    void AgregarAuditoria(AuditoriaLog auditoria);
    Task GuardarCambiosAsync();
    Task<(List<Subasta> Items, int TotalCount)> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda,
        decimal? precioMin = null, decimal? precioMax = null, string? ordenamiento = null);
    Task<Subasta?> ObtenerSubastaAsync(int id);
}
