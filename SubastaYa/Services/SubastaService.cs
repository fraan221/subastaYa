using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

public class SubastaService : ISubastaService
{
    private readonly ISubastaRepository _subastaRepository;

    public SubastaService(ISubastaRepository subastaRepository)
    {
        _subastaRepository = subastaRepository;
    }
    //Listado de subastas
    public async Task<PaginacionResponse<SubastaListadoResponse>> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda)
    {
        // 1. Normalizar parámetros de paginación
        if (pagina < 1) pagina = 1;
        if (tamaño < 1 || tamaño > 50) tamaño = 10;

        // 2. Delegar al repositorio
        var (items, totalCount) = await _subastaRepository.ListarSubastasAsync(
            pagina, tamaño, estado, categoriaId, busqueda);

        // 3. Mapear entidades a DTOs
        var itemsDto = items.Select(s => new SubastaListadoResponse
        {
            Id = s.Id,
            Titulo = s.Titulo,
            UrlImagen = s.UrlImagen,
            PrecioBase = s.PrecioBase,
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
            VendedorNombre = subasta.Vendedor.Nombre,
            CategoriaNombre = subasta.Categoria.Nombre,
            CantidadPujas = subasta.Pujas.Count,
            MontoActual = pujaActual?.Monto,
            UltimaPujaComprador = pujaActual?.Comprador.Nombre,
            FechaUltimaPuja = pujaActual?.FechaPuja
        };
    }

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

        // 5. Persistir
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
