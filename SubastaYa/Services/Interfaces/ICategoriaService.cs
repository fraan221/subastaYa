using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

public interface ICategoriaService
{
    Task<IReadOnlyList<CategoriaResponse>> ListarAsync(
        CancellationToken cancellationToken = default);
}
