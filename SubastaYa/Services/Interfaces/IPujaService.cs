using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

/// <summary>
/// Define los contratos de servicio para la gestión transaccional de ofertas en subastas,
/// retención de fondos y consulta de historial.
/// </summary>
public interface IPujaService
{
    /// <summary>
    /// Procesa de forma transaccional una nueva oferta sobre una subasta activa.
    /// </summary>
    /// <param name="subastaId">Identificador único de la subasta.</param>
    /// <param name="request">Datos de la oferta enviada por el comprador.</param>
    /// <returns>Resultado consolidado de la puja con detalles de extensión si aplicó.</returns>
    Task<PujaResponse> RealizarPujaAsync(int subastaId, CrearPujaRequest request);

    /// <summary>
    /// Obtiene el historial cronológico de posturas registradas en una subasta con identidad anonimizada.
    /// </summary>
    /// <param name="subastaId">Identificador único de la subasta.</param>
    /// <param name="cancellationToken">Token de cancelación de la operación asíncrona.</param>
    /// <returns>Lista de pujas históricas formateadas para visualización pública.</returns>
    Task<List<PujaHistorialResponse>> ObtenerHistorialPujasAsync(int subastaId, CancellationToken cancellationToken = default);
}
