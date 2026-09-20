using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

/// <summary>
/// Proporciona la lógica de negocio para consultar el historial de actividad de los usuarios,
/// incluyendo las subastas en las que han participado como postores y las publicaciones creadas como vendedores.
/// Implementa <see cref="IActivitiesService"/>.
/// </summary>
public class ActivitiesService : IActivitiesService
{
    private readonly IActivitiesRepository _activitiesRepository;

    /// <summary>
    /// Inicializa una nueva instancia de <see cref="ActivitiesService"/>.
    /// </summary>
    /// <param name="activitiesRepository">Repositorio para consultar la actividad de subastas y pujas.</param>
    public ActivitiesService(IActivitiesRepository activitiesRepository)
    {
        _activitiesRepository = activitiesRepository;
    }

    /// <summary>
    /// Obtiene el listado paginado de subastas donde el usuario especificado ha emitido al menos una puja,
    /// calculando su puja máxima personal y el resultado de su participación.
    /// </summary>
    /// <param name="usuarioId">Identificador único del usuario postor.</param>
    /// <param name="pagina">Número de página solicitada (se normaliza a 1 si es menor a 1).</param>
    /// <param name="tamaño">Cantidad de elementos por página (se ajusta a 10 si es menor a 1 o superior a 50).</param>
    /// <returns>
    /// Una respuesta paginada (<see cref="PaginacionResponse{T}"/>) con elementos de tipo <see cref="MiPujaActividadResponse"/>.
    /// </returns>
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

    /// <summary>
    /// Obtiene el listado paginado de subastas publicadas por el usuario vendedor,
    /// incluyendo métricas de recaudación, pujas recibidas y estado de adjudicación.
    /// </summary>
    /// <param name="usuarioId">Identificador único del usuario vendedor.</param>
    /// <param name="pagina">Número de página solicitada (se normaliza a 1 si es menor a 1).</param>
    /// <param name="tamaño">Cantidad de elementos por página (se ajusta a 10 si es menor a 1 o superior a 50).</param>
    /// <returns>
    /// Una respuesta paginada (<see cref="PaginacionResponse{T}"/>) con elementos de tipo <see cref="MiPublicacionActividadResponse"/>.
    /// </returns>
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

    /// <summary>
    /// Transforma una entidad <see cref="Subasta"/> en un DTO <see cref="MiPujaActividadResponse"/>
    /// con respecto a un postor específico.
    /// </summary>
    /// <param name="subasta">Instancia de la subasta con sus pujas asociadas.</param>
    /// <param name="usuarioId">Identificador del postor.</param>
    /// <returns>Objeto <see cref="MiPujaActividadResponse"/> con los datos consolidados.</returns>
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

    /// <summary>
    /// Transforma una entidad <see cref="Subasta"/> en un DTO <see cref="MiPublicacionActividadResponse"/>
    /// orientado a la perspectiva del vendedor.
    /// </summary>
    /// <param name="subasta">Instancia de la subasta con sus pujas asociadas.</param>
    /// <returns>Objeto <see cref="MiPublicacionActividadResponse"/> con métricas comerciales.</returns>
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

    /// <summary>
    /// Determina la puja líder o ganadora de una subasta, priorizando mayor monto y fecha más reciente ante empate.
    /// </summary>
    /// <param name="subasta">Subasta con sus pujas cargadas.</param>
    /// <returns>La <see cref="Puja"/> ganadora, o <c>null</c> si no hubo ofertas.</returns>
    private static Puja? ObtenerPujaGanadora(Subasta subasta)
    {
        return subasta.Pujas
            .OrderByDescending(puja => puja.Monto)
            .ThenByDescending(puja => puja.FechaPuja)
            .FirstOrDefault();
    }

    /// <summary>
    /// Calcula el estado textual del resultado de la participación del postor (ej. "Ganaste", "Perdiste", "Desierta", "Abierta").
    /// </summary>
    /// <param name="subasta">Entidad subasta evaluada.</param>
    /// <param name="pujaGanadora">Puja con mayor valor registrada.</param>
    /// <param name="usuarioId">Identificador del usuario postor.</param>
    /// <returns>Cadena descriptiva con el resultado para el postor.</returns>
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

    /// <summary>
    /// Determina el estado de adjudicación de la publicación desde la perspectiva del vendedor.
    /// </summary>
    /// <param name="subasta">Subasta evaluada.</param>
    /// <returns>"Adjudicada", "Desierta" o "Pendiente".</returns>
    private static string ObtenerEstadoAdjudicacion(Subasta subasta)
    {
        return subasta.Estado switch
        {
            EstadoSubasta.Finalizada => "Adjudicada",
            EstadoSubasta.Desierta => "Desierta",
            _ => "Pendiente"
        };
    }

    /// <summary>
    /// Normaliza el número de página solicitado, garantizando que sea al menos 1.
    /// </summary>
    /// <param name="pagina">Número de página provisto.</param>
    /// <returns>Valor de página válido (>= 1).</returns>
    private static int NormalizarPagina(int pagina)
    {
        return pagina < 1 ? 1 : pagina;
    }

    /// <summary>
    /// Normaliza el tamaño de página solicitado, asegurando que se ubique dentro del rango [1, 50],
    /// retornando 10 por defecto en caso contrario.
    /// </summary>
    /// <param name="tamaño">Tamaño de página provisto.</param>
    /// <returns>Tamaño de página normalizado.</returns>
    private static int NormalizarTamaño(int tamaño)
    {
        return tamaño is < 1 or > 50 ? 10 : tamaño;
    }

    /// <summary>
    /// Construye una instancia de <see cref="PaginacionResponse{T}"/> calculando el total de páginas requeridas.
    /// </summary>
    /// <typeparam name="T">Tipo de dato de los elementos paginados.</typeparam>
    /// <param name="items">Lista de elementos en la página actual.</param>
    /// <param name="pagina">Número de página actual.</param>
    /// <param name="tamaño">Tamaño de página utilizado.</param>
    /// <param name="totalItems">Total global de registros que coincidieron con la consulta.</param>
    /// <returns>Estructura de respuesta paginada con metadatos de navegación.</returns>
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
