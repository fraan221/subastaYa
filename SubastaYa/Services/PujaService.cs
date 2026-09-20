using System.Text.Json;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using SubastaYa.Hubs;

namespace SubastaYa.Services;

/// <summary>
/// Motor principal de procesamiento de pujas en tiempo real.
/// Administra la validación competitiva, el sistema de garantía de fondos (escrow),
/// la regla anti-sniping y la difusión de eventos mediante SignalR.
/// Implementa <see cref="IPujaService"/>.
/// </summary>
public class PujaService : IPujaService
{
    private const int UmbralAntiSnipingSegundos = 60;
    private const int ExtensionAntiSnipingMinutos = 2;
    private const int MaxExtensionesAntiSniping = 3;

    private readonly IPujaRepository _pujaRepository;
    private readonly IHubContext<AuctionHub> _hubContext;
    private readonly ILogger<PujaService> _logger;

    /// <summary>
    /// Inicializa una nueva instancia de <see cref="PujaService"/>.
    /// </summary>
    /// <param name="pujaRepository">Repositorio para acceso a datos de pujas, billeteras y subastas.</param>
    /// <param name="hubContext">Contexto del hub SignalR para la difusión de eventos de subasta.</param>
    /// <param name="logger">Instancia del registrador de eventos del sistema.</param>
    public PujaService(
        IPujaRepository pujaRepository,
        IHubContext<AuctionHub> hubContext,
        ILogger<PujaService> logger)
    {
        _pujaRepository = pujaRepository;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Procesa una nueva oferta de compra sobre una subasta activa de forma transaccional.
    /// </summary>
    /// <param name="subastaId">Identificador único de la subasta receptora de la puja.</param>
    /// <param name="request">Datos de la oferta, incluyendo identificador del postor y monto ofertado.</param>
    /// <returns>
    /// Un <see cref="PujaResponse"/> con los datos de la puja consolidada y metadatos de extensión anti-sniping.
    /// </returns>
    /// <exception cref="NotFoundException">
    /// Se lanza si el comprador o la subasta no existen, o si el comprador no posee billetera creada.
    /// </exception>
    /// <exception cref="BusinessRuleException">
    /// Se lanza si la subasta no está activa, si ha finalizado, si el postor es el vendedor,
    /// si el postor ya lidera la subasta, si el monto no supera el incremento mínimo,
    /// o si no dispone de saldo suficiente en billetera.
    /// </exception>
    /// <exception cref="ConcurrencyConflictException">
    /// Se lanza ante colisiones de concurrencia optimista al persistir cambios simultáneos.
    /// </exception>
    public async Task<PujaResponse> RealizarPujaAsync(int subastaId, CrearPujaRequest request)
    {
        try
        {
            return await EjecutarPujaAsync(subastaId, request);
        }
        catch (BusinessRuleException ex)
        {
            await TryLogRejectionAsync(subastaId, request, ex.Message);
            throw;
        }
        catch (NotFoundException ex)
        {
            await TryLogRejectionAsync(subastaId, request, ex.Message);
            throw;
        }
        catch (ConcurrencyConflictException ex)
        {
            await TryLogRejectionAsync(subastaId, request, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Ejecuta el algoritmo de validación de negocio, retención/liberación de fondos (escrow),
    /// regla anti-sniping y persistencia atómica de la puja.
    /// </summary>
    /// <param name="subastaId">Identificador de la subasta.</param>
    /// <param name="request">Datos de la oferta.</param>
    /// <returns>Respuesta detallada con los datos de la puja persistida.</returns>
    private async Task<PujaResponse> EjecutarPujaAsync(int subastaId, CrearPujaRequest request)
    {
        // 1. Validar existencia del comprador
        var existeComprador = await _pujaRepository.ExisteUsuarioAsync(request.CompradorId);
        if (!existeComprador)
        {
            throw new NotFoundException($"El comprador con ID {request.CompradorId} no existe.");
        }

        // 2. Validar existencia de la subasta
        var subasta = await _pujaRepository.ObtenerSubastaConPujasAsync(subastaId);
        if (subasta == null)
        {
            throw new NotFoundException($"La subasta con ID {subastaId} no existe.");
        }

        // 3. Validar estado de la subasta
        if (subasta.Estado != EstadoSubasta.Activa)
        {
            throw new BusinessRuleException($"La subasta no está activa (Estado actual: {subasta.Estado}).");
        }

        var ahora = DateTime.UtcNow;
        if (ahora >= subasta.FechaFin)
        {
            throw new BusinessRuleException("La subasta ya ha finalizado.");
        }

        // 4. Validar reglas del comprador
        if (subasta.VendedorId == request.CompradorId)
        {
            throw new BusinessRuleException("El vendedor no puede realizar ofertas en su propia subasta.");
        }

        var ultimaPuja = subasta.Pujas
            .OrderByDescending(p => p.Monto)
            .ThenByDescending(p => p.FechaPuja)
            .FirstOrDefault();
        if (ultimaPuja != null)
        {
            if (ultimaPuja.CompradorId == request.CompradorId)
            {
                throw new BusinessRuleException("Ya posees la puja más alta en esta subasta.");
            }
            //Puja mas alta actualizada.
            var montoMinimo = ultimaPuja.Monto + subasta.IncrementoMinimo;
            if (request.Monto < montoMinimo)
            {
                throw new BusinessRuleException(
                    $"El monto debe ser de al menos {montoMinimo} (puja actual de {ultimaPuja.Monto} + incremento mínimo de {subasta.IncrementoMinimo}).");
            }
        }
        else
        {
            if (request.Monto < subasta.PrecioBase)
            {
                throw new BusinessRuleException(
                    $"El monto de la primera puja debe ser de al menos el precio base ({subasta.PrecioBase}).");
            }
        }

        // 5. Validar billetera y fondos disponibles del comprador (Escrow)
        var billeteraComprador = await _pujaRepository.ObtenerBilleteraPorUsuarioAsync(request.CompradorId);
        if (billeteraComprador == null)
        {
            throw new NotFoundException($"El comprador con ID {request.CompradorId} no posee una billetera registrada.");
        }

        if (billeteraComprador.SaldoDisponible < request.Monto)
        {
            throw new BusinessRuleException(
                $"Saldo insuficiente. Saldo disponible: {billeteraComprador.SaldoDisponible}, Monto requerido: {request.Monto}.");
        }

        // 6. Retener saldo del nuevo comprador
        billeteraComprador.SaldoDisponible -= request.Monto;
        billeteraComprador.SaldoRetenido += request.Monto;
        billeteraComprador.Version++;

        var transaccionRetencion = new TransaccionLedger
        {
            BilleteraId = billeteraComprador.Id,
            Tipo = TipoTransaccion.Retencion,
            Monto = request.Monto,
            Fecha = ahora,
            SubastaId = subasta.Id
        };
        _pujaRepository.AgregarTransaccion(transaccionRetencion);

        // 7. Liberar saldo retenido al comprador anterior (si existía una puja previa)
        if (ultimaPuja != null)
        {
            var billeteraAnterior = await _pujaRepository.ObtenerBilleteraPorUsuarioAsync(ultimaPuja.CompradorId);
            if (billeteraAnterior != null)
            {
                billeteraAnterior.SaldoRetenido -= ultimaPuja.Monto;
                billeteraAnterior.SaldoDisponible += ultimaPuja.Monto;
                billeteraAnterior.Version++;

                var transaccionLiberacion = new TransaccionLedger
                {
                    BilleteraId = billeteraAnterior.Id,
                    Tipo = TipoTransaccion.Liberacion,
                    Monto = ultimaPuja.Monto,
                    Fecha = ahora,
                    SubastaId = subasta.Id
                };
                _pujaRepository.AgregarTransaccion(transaccionLiberacion);
            }
            else
            {
                _logger.LogWarning(
                    "Billetera no encontrada para el postor anterior {CompradorId} en subasta {SubastaId}. " +
                    "Fondos retenidos podrían quedar bloqueados.",
                    ultimaPuja.CompradorId, subasta.Id);
            }
        }

        // 8. Crear nueva puja
        var nuevaPuja = new Puja
        {
            SubastaId = subasta.Id,
            CompradorId = request.CompradorId,
            Monto = request.Monto,
            FechaPuja = ahora
        };
        _pujaRepository.AgregarPuja(nuevaPuja);

        // 9. Evaluar regla Anti-sniping y Concurrencia en Subasta
        bool fueAntiSniping = false;
        DateTime? nuevaFechaFin = null;

        var fechaFinOriginal = subasta.FechaFin;
        var tiempoRestante = subasta.FechaFin - ahora;
        if (tiempoRestante.TotalSeconds <= UmbralAntiSnipingSegundos)
        {
            var extensionesPrevias = await _pujaRepository.ContarExtensionesAntiSnipingAsync(subasta.Id);

            if (extensionesPrevias < MaxExtensionesAntiSniping)
            {
                fueAntiSniping = true;
                subasta.FechaFin = subasta.FechaFin.AddMinutes(ExtensionAntiSnipingMinutos);
                nuevaFechaFin = subasta.FechaFin;

                var auditoria = new AuditoriaLog
                {
                    Entidad = nameof(Subasta),
                    EntidadId = subasta.Id,
                    Accion = "AntiSniping",
                    UsuarioId = request.CompradorId,
                    DetalleJson = JsonSerializer.Serialize(new
                    {
                        CompradorId = request.CompradorId,
                        Monto = request.Monto,
                        FechaFinPrevia = fechaFinOriginal,
                        ExtensionMinutos = ExtensionAntiSnipingMinutos,
                        NuevaFechaFin = subasta.FechaFin
                    }),
                    Fecha = ahora
                };
                _pujaRepository.AgregarAuditoria(auditoria);
            }
        }

        subasta.Version++;

        // 10. Persistir cambios de forma atómica
        await _pujaRepository.GuardarCambiosAsync();

        var response = new PujaResponse
        {
            PujaId = nuevaPuja.Id,
            SubastaId = subasta.Id,
            CompradorId = nuevaPuja.CompradorId,
            CompradorSeudonimo = GenerarSeudonimo(nuevaPuja.CompradorId),
            Monto = nuevaPuja.Monto,
            FechaPuja = nuevaPuja.FechaPuja,
            FueAntiSniping = fueAntiSniping,
            NuevaFechaFin = nuevaFechaFin
        };

        // 11. Emitir eventos en tiempo real
        await _hubContext.Clients.Group($"auction-{subasta.Id}")
            .SendAsync("NewBid", response);

        if (fueAntiSniping)
        {
            await _hubContext.Clients.Group($"auction-{subasta.Id}")
                .SendAsync("AuctionExtended", new
                {
                    SubastaId = subasta.Id,
                    NuevaFechaFin = subasta.FechaFin
                });
        }

        return response;
    }

    /// <summary>
    /// Registra en la auditoría del sistema el intento fallido de puja de forma protegida.
    /// </summary>
    /// <param name="subastaId">Identificador de la subasta.</param>
    /// <param name="request">Datos de la puja rechazada.</param>
    /// <param name="motivo">Causa o mensaje descriptivo del rechazo.</param>
    /// <returns>Una tarea que representa la operación asíncrona.</returns>
    private async Task TryLogRejectionAsync(int subastaId, CrearPujaRequest request, string motivo)
    {
        try
        {
            await RegistrarRechazoAsync(subastaId, request, motivo);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "No se pudo registrar el rechazo de puja para subasta {SubastaId}.", subastaId);
        }
    }

    private async Task RegistrarRechazoAsync(int subastaId, CrearPujaRequest request, string motivo)
    {
        _pujaRepository.LimpiarRastreador();

        var existeUsuario = await _pujaRepository.ExisteUsuarioAsync(request.CompradorId);

        var auditoria = new AuditoriaLog
        {
            Entidad = nameof(Puja),
            EntidadId = subastaId,
            Accion = "PujaRechazada",
            UsuarioId = existeUsuario ? request.CompradorId : null,
            DetalleJson = JsonSerializer.Serialize(new
            {
                Motivo = motivo,
                Monto = request.Monto,
                CompradorIdSolicitado = request.CompradorId
            }),
            Fecha = DateTime.UtcNow
        };
        _pujaRepository.AgregarAuditoria(auditoria);
        await _pujaRepository.GuardarCambiosAsync();
    }

    /// <summary>
    /// Genera un seudónimo anonimizado para proteger la identidad del comprador en la sala en vivo.
    /// </summary>
    /// <param name="compradorId">Identificador único del postor.</param>
    /// <returns>Seudónimo público del comprador.</returns>
    public static string GenerarSeudonimo(int compradorId) => $"Postor #{compradorId}";

    /// <summary>
    /// Obtiene el historial cronológico de todas las pujas realizadas en una subasta con identidad anonimizada.
    /// </summary>
    /// <param name="subastaId">Identificador único de la subasta.</param>
    /// <param name="cancellationToken">Token de cancelación de la operación asíncrona.</param>
    /// <returns>Lista de pujas históricas formateadas para visualización pública.</returns>
    /// <exception cref="NotFoundException">
    /// Se lanza cuando no existe ninguna subasta con el <paramref name="subastaId"/> especificado.
    /// </exception>
    public async Task<List<PujaHistorialResponse>> ObtenerHistorialPujasAsync(int subastaId, CancellationToken cancellationToken = default)
    {
        var subasta = await _pujaRepository.ObtenerSubastaConPujasAsync(subastaId);
        if (subasta == null)
        {
            throw new NotFoundException($"No se encontró la subasta con ID {subastaId}.");
        }

        var pujas = await _pujaRepository.ObtenerHistorialPorSubastaAsync(subastaId, cancellationToken);
        return pujas.Select(p => new PujaHistorialResponse
        {
            PujaId = p.Id,
            SubastaId = p.SubastaId,
            CompradorId = p.CompradorId,
            CompradorSeudonimo = GenerarSeudonimo(p.CompradorId),
            Monto = p.Monto,
            FechaPuja = p.FechaPuja
        }).ToList();
    }
}
