using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

/// <summary>
/// Proporciona la lógica de negocio para la gestión y consulta de categorías de subastas.
/// Implementa <see cref="ICategoriaService"/>.
/// </summary>
public class CategoriaService : ICategoriaService
{
    private readonly ICategoriaRepository _categoriaRepository;

    /// <summary>
    /// Inicializa una nueva instancia de <see cref="CategoriaService"/> con el repositorio requerido.
    /// </summary>
    /// <param name="categoriaRepository">Repositorio para acceso y consulta a los datos de categorías.</param>
    public CategoriaService(ICategoriaRepository categoriaRepository)
    {
        _categoriaRepository = categoriaRepository;
    }

    /// <summary>
    /// Obtiene la lista completa de categorías activas en el sistema, proyectadas al formato de respuesta.
    /// </summary>
    /// <param name="cancellationToken">Token de cancelación para abortar la operación asíncrona en caso de desconexión.</param>
    /// <returns>
    /// Una lista de solo lectura (<see cref="IReadOnlyList{T}"/>) con los objetos <see cref="CategoriaResponse"/> disponibles.
    /// </returns>
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