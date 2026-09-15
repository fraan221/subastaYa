using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface ICategoriaRepository
{
    Task<List<Categoria>> ListarAsync(
        CancellationToken cancellationToken = default);
}
