using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

public class ActivitiesService : IActivitiesService
{
    private readonly IActivitiesRepository _activitiesRepository;

    public ActivitiesService(IActivitiesRepository activitiesRepository)
    {
        _activitiesRepository = activitiesRepository;
    }

    public async Task<PaginacionResponse<MiPujaActividadResponse>> ObtenerMisPujasAsync(
        int usuarioId,
        int pagina,
        int tamaño)
    {
        pagina = NormalizarPagina(pagina);
        tamaño = NormalizarTamaño(tamaño);

        var resultado = await _activitiesRepository
            .ObtenerSubastasConMisPujasAsync(usuarioId, pagina, tamaño);

        var items = resultado.Items
            .Select(subasta => MapearMiPuja(subasta, usuarioId))
            .ToList();

        return CrearRespuestaPaginada(items, pagina, tamaño, resultado.TotalCount);
    }

    public async Task<PaginacionResponse<MiPublicacionActividadResponse>> ObtenerMisPublicacionesAsync(
        int usuarioId,
        int pagina,
        int tamaño)
    {
        pagina = NormalizarPagina(pagina);
        tamaño = NormalizarTamaño(tamaño);

        var resultado = await _activitiesRepository
            .ObtenerMisPublicacionesAsync(usuarioId, pagina, tamaño);

        var items = resultado.Items
            .Select(MapearPublicacion)
            .ToList();

        return CrearRespuestaPaginada(items, pagina, tamaño, resultado.TotalCount);
    }

    private static MiPujaActividadResponse MapearMiPuja(
        Subasta subasta,
        int usuarioId)
    {
        var pujaGanadora = ObtenerPujaGanadora(subasta);
        var miPujaMaxima = subasta.Pujas
            .Where(puja => puja.CompradorId == usuarioId)
            .Max(puja => puja.Monto);

        return new MiPujaActividadResponse
        {
            Id = subasta.Id,
            Titulo = subasta.Titulo,
            UrlImagen = subasta.UrlImagen,
            CategoriaNombre = subasta.Categoria.Nombre,
            FechaInicio = subasta.FechaInicio,
            FechaFin = subasta.FechaFin,
            Estado = subasta.Estado.ToString(),
            MiPujaMaxima = miPujaMaxima,
            MontoActual = pujaGanadora?.Monto,
            CantidadPujas = subasta.Pujas.Count,
            Resultado = ObtenerResultado(subasta, pujaGanadora, usuarioId)
        };
    }

    private static MiPublicacionActividadResponse MapearPublicacion(Subasta subasta)
    {
        var pujaGanadora = ObtenerPujaGanadora(subasta);
        var montoActual = pujaGanadora?.Monto;

        return new MiPublicacionActividadResponse
        {
            Id = subasta.Id,
            Titulo = subasta.Titulo,
            UrlImagen = subasta.UrlImagen,
            CategoriaNombre = subasta.Categoria.Nombre,
            FechaInicio = subasta.FechaInicio,
            FechaFin = subasta.FechaFin,
            Estado = subasta.Estado.ToString(),
            CantidadPujas = subasta.Pujas.Count,
            MontoActual = montoActual,
            MontoAdjudicado = subasta.Estado == EstadoSubasta.Finalizada
                ? montoActual
                : null,
            Recaudacion = montoActual ?? 0,
            GanadorNombre = subasta.Estado == EstadoSubasta.Finalizada
                ? pujaGanadora?.Comprador.Nombre
                : null,
            EstadoAdjudicacion = ObtenerEstadoAdjudicacion(subasta)
        };
    }

    private static Puja? ObtenerPujaGanadora(Subasta subasta)
    {
        return subasta.Pujas
            .OrderByDescending(puja => puja.Monto)
            .ThenByDescending(puja => puja.FechaPuja)
            .FirstOrDefault();
    }

    private static string ObtenerResultado(
        Subasta subasta,
        Puja? pujaGanadora,
        int usuarioId)
    {
        if (subasta.Estado == EstadoSubasta.Desierta)
        {
            return "Desierta";
        }

        if (subasta.Estado == EstadoSubasta.Finalizada)
        {
            if (pujaGanadora is null)
            {
                return "Desierta";
            }

            return pujaGanadora.CompradorId == usuarioId
                ? "Ganaste"
                : "Perdiste";
        }

        return subasta.Estado == EstadoSubasta.Programada
            ? "Programada"
            : "Abierta";
    }

    private static string ObtenerEstadoAdjudicacion(Subasta subasta)
    {
        return subasta.Estado switch
        {
            EstadoSubasta.Finalizada => "Adjudicada",
            EstadoSubasta.Desierta => "Desierta",
            _ => "Pendiente"
        };
    }

    private static int NormalizarPagina(int pagina)
    {
        return pagina < 1 ? 1 : pagina;
    }

    private static int NormalizarTamaño(int tamaño)
    {
        return tamaño is < 1 or > 50 ? 10 : tamaño;
    }

    private static PaginacionResponse<T> CrearRespuestaPaginada<T>(
        List<T> items,
        int pagina,
        int tamaño,
        int totalItems)
    {
        return new PaginacionResponse<T>
        {
            Items = items,
            PaginaActual = pagina,
            TamañoPagina = tamaño,
            TotalItems = totalItems,
            TotalPaginas = (int)Math.Ceiling(totalItems / (double)tamaño)
        };
    }
}
