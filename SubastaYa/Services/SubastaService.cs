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