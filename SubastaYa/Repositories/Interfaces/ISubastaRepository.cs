using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface ISubastaRepository
{
    Task<bool> ExisteUsuarioAsync(int usuarioId);
    Task<bool> ExisteCategoriaAsync(int categoriaId);
    void AgregarSubasta(Subasta subasta);
    Task GuardarCambiosAsync();
}