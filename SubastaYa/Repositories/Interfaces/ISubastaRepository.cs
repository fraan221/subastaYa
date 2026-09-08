using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;

namespace SubastaYa.Repositories.Interfaces;

public interface ISubastaRepository
{
    Task<bool> ExisteUsuarioAsync(int usuarioId);
    Task<bool> ExisteCategoriaAsync(int categoriaId);
    void AgregarSubasta(Subasta subasta);
    Task GuardarCambiosAsync();
    Task<(List<Subasta> Items, int TotalCount)> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda);
}
