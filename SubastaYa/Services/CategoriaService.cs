using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

public class CategoriaService : ICategoriaService
{
    private readonly ICategoriaRepository _categoriaRepository;

    public CategoriaService(ICategoriaRepository categoriaRepository)
    {
        _categoriaRepository = categoriaRepository;
    }

    public async Task<IReadOnlyList<CategoriaResponse>> ListarAsync(
        CancellationToken cancellationToken = default)
    {
        var categorias = await _categoriaRepository.ListarAsync(
            cancellationToken);

        return categorias
            .Select(categoria => new CategoriaResponse
            {
                Id = categoria.Id,
                Nombre = categoria.Nombre
            })
            .ToList();
    }
}
