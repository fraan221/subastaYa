using System.Text.Json;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

/// <summary>
/// Proporciona la lógica de negocio para la publicación, consulta detallada
/// y catálogo filtrado de subastas en el sistema.
/// Implementa <see cref="ISubastaService"/>.
/// </summary>
public class SubastaService : ISubastaService
{
    private readonly ISubastaRepository _subastaRepository;

    /// <summary>
    /// Inicializa una nueva instancia de <see cref="SubastaService"/>.
    /// </summary>
    /// <param name="subastaRepository">Repositorio para persistencia y filtrado de subastas.</param>
    public SubastaService(ISubastaRepository subastaRepository)
    {
        _subastaRepository = subastaRepository;
    }

    /// <summary>
    /// Consulta el catálogo de subastas aplicando filtros de estado, categoría, búsqueda por texto,
    /// rango de precios, ordenamiento y paginación normalizada.
    /// </summary>
    /// <param name="pagina">Número de página solicitada (mínimo 1).</param>
    /// <param name="tamaño">Cantidad de elementos por página (acotado entre 1 y 50, defecto: 10).</param>
    /// <param name="estado">Filtro opcional por estado de la subasta (<see cref="EstadoSubasta"/>).</param>
    /// <param name="categoriaId">Identificador opcional de la categoría.</param>
    /// <param name="busqueda">Término de búsqueda parcial sobre el título de la subasta.</param>
    /// <param name="precioMin">Límite inferior de precio base para filtrar.</param>
    /// <param name="precioMax">Límite superior de precio base para filtrar.</param>
    /// <param name="ordenamiento">Criterio de ordenamiento (ej. fecha, precio).</param>
    /// <returns>
    /// Una estructura paginada (<see cref="PaginacionResponse{T}"/>) con elementos <see cref="SubastaListadoResponse"/>.
    /// </returns>
    public async Task<PaginacionResponse<SubastaListadoResponse>> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda,
        decimal? precioMin = null, decimal? precioMax = null, string? ordenamiento = null)
    {
        // 1. Normalizar parámetros de paginación
        if (pagina < 1) pagina = 1;
        if (tamaño < 1 || tamaño > 50) tamaño = 10;

        // 2. Delegar al repositorio
        var (items, totalCount) = await _subastaRepository.ListarSubastasAsync(
            pagina, tamaño, estado, categoriaId, busqueda, precioMin, precioMax, ordenamiento);

        // 3. Mapear entidades a DTOs
        var itemsDto = items.Select(s => new SubastaListadoResponse
        {
            Id = s.Id,
            Titulo = s.Titulo,
            UrlImagen = s.UrlImagen,
            PrecioBase = s.PrecioBase,
            FechaInicio = s.FechaInicio,
            FechaFin = s.FechaFin,
            Estado = s.Estado.ToString(),
            CategoriaNombre = s.Categoria.Nombre,
            CantidadPujas = s.Pujas.Count,
            MontoActual = s.Pujas.Any() ? s.Pujas.Max(p => p.Monto) : null
        }).ToList();

        // 4. Armar respuesta paginada
        return new PaginacionResponse<SubastaListadoResponse>
        {
            Items = itemsDto,
            PaginaActual = pagina,
            TamañoPagina = tamaño,
            TotalItems = totalCount,
            TotalPaginas = (int)Math.Ceiling(totalCount / (double)tamaño)
        };
    }

    /// <summary>
    /// Obtiene la ficha técnica completa de una subasta por su identificador único,
    /// incluyendo información del vendedor, categoría y la puja líder actual.
    /// </summary>
    /// <param name="id">Identificador único de la subasta.</param>
    /// <returns>Detalle consolidado en un <see cref="SubastaDetalleResponse"/>.</returns>
    /// <exception cref="NotFoundException">
    /// Se lanza cuando no existe ninguna subasta con el <paramref name="id"/> especificado.
    /// </exception>
    public async Task<SubastaDetalleResponse> ObtenerSubastaAsync(int id)
    {
        var subasta = await _subastaRepository.ObtenerSubastaAsync(id);
        if (subasta is null)
        {
            throw new NotFoundException($"La subasta con ID {id} no existe.");
        }

        var pujaActual = subasta.Pujas
            .OrderByDescending(p => p.Monto)
            .ThenByDescending(p => p.FechaPuja)
            .FirstOrDefault();

        return new SubastaDetalleResponse
        {
            Id = subasta.Id,
            Titulo = subasta.Titulo,
            Descripcion = subasta.Descripcion,
            UrlImagen = subasta.UrlImagen,
            PrecioBase = subasta.PrecioBase,
            IncrementoMinimo = subasta.IncrementoMinimo,
            FechaInicio = subasta.FechaInicio,
            FechaFin = subasta.FechaFin,
            Estado = subasta.Estado.ToString(),
            Version = subasta.Version,
            VendedorId = subasta.VendedorId,
            VendedorNombre = subasta.Vendedor.Nombre,
            CategoriaNombre = subasta.Categoria.Nombre,
            CantidadPujas = subasta.Pujas.Count,
            MontoActual = pujaActual?.Monto,
            UltimaPujaComprador = pujaActual?.Comprador.Nombre,
            FechaUltimaPuja = pujaActual?.FechaPuja
        };
    }

    /// <summary>
    /// Crea y programa una nueva subasta en el sistema previa validación de existencia de vendedor,
    /// categoría y consistencia temporal de las fechas de inicio y cierre.
    /// </summary>
    /// <param name="request">Datos requeridos para dar de alta la subasta.</param>
    /// <returns>Datos de la subasta recién creada en un <see cref="SubastaResponse"/>.</returns>
    /// <exception cref="NotFoundException">
    /// Se lanza si el vendedor especificado o la categoría seleccionada no existen.
    /// </exception>
    /// <exception cref="BusinessRuleException">
    /// Se lanza si la fecha de inicio es anterior a la fecha y hora actual (UTC),
    /// o si la fecha de fin no es estrictamente posterior a la de inicio.
    /// </exception>
    public async Task<SubastaResponse> CrearSubastaAsync(CrearSubastaRequest request)
    {
        // 1. Validar existencia del vendedor
        var existeVendedor = await _subastaRepository.ExisteUsuarioAsync(request.VendedorId);
        if (!existeVendedor)
        {
            throw new NotFoundException($"El vendedor con ID {request.VendedorId} no existe.");
        }

        // 2. Validar existencia de la categoría
        var existeCategoria = await _subastaRepository.ExisteCategoriaAsync(request.CategoriaId);
        if (!existeCategoria)
        {
            throw new NotFoundException($"La categoría con ID {request.CategoriaId} no existe.");
        }

        // 3. Validar fechas
        var ahora = DateTime.UtcNow;

        if (request.FechaInicio < ahora)
        {
            throw new BusinessRuleException("La fecha de inicio no puede ser en el pasado.");
        }

        if (request.FechaFin <= request.FechaInicio)
        {
            throw new BusinessRuleException("La fecha de fin debe ser posterior a la fecha de inicio.");
        }

        // 4. Crear entidad
        var subasta = new Subasta
        {
            VendedorId = request.VendedorId,
            CategoriaId = request.CategoriaId,
            Titulo = request.Titulo,
            Descripcion = request.Descripcion,
            UrlImagen = request.UrlImagen,
            PrecioBase = request.PrecioBase,
            IncrementoMinimo = request.IncrementoMinimo,
            FechaInicio = request.FechaInicio,
            FechaFin = request.FechaFin,
            Estado = EstadoSubasta.Programada,
            Version = 0
        };

        _subastaRepository.AgregarSubasta(subasta);

        var auditoria = new AuditoriaLog
        {
            Entidad = nameof(Subasta),
            EntidadId = subasta.Id,
            Accion = "SubastaCreada",
            UsuarioId = subasta.VendedorId,
            DetalleJson = JsonSerializer.Serialize(new
            {
                subasta.Titulo,
                subasta.PrecioBase,
                subasta.IncrementoMinimo,
                subasta.FechaInicio,
                subasta.FechaFin,
                EstadoInicial = subasta.Estado.ToString()
            }),
            Fecha = DateTime.UtcNow
        };
        _subastaRepository.AgregarAuditoria(auditoria);

        // 5. Persistir de forma atómica
        await _subastaRepository.GuardarCambiosAsync();

        // 6. Retornar respuesta
        return new SubastaResponse
        {
            Id = subasta.Id,
            VendedorId = subasta.VendedorId,
            CategoriaId = subasta.CategoriaId,
            Titulo = subasta.Titulo,
            Descripcion = subasta.Descripcion,
            UrlImagen = subasta.UrlImagen,
            PrecioBase = subasta.PrecioBase,
            IncrementoMinimo = subasta.IncrementoMinimo,
            FechaInicio = subasta.FechaInicio,
            FechaFin = subasta.FechaFin,
            Estado = subasta.Estado.ToString()
        };
    }
}
