using System.Text.Json;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

public class PujaService : IPujaService
{
    private const int UmbralAntiSnipingSegundos = 60;
    private const int ExtensionAntiSnipingMinutos = 2;

    private readonly IPujaRepository _pujaRepository;

    public PujaService(IPujaRepository pujaRepository)
    {
        _pujaRepository = pujaRepository;
    }

    //Realizar puja: Logica para que se pueda realizar una competencia segura.
    public async Task<PujaResponse> RealizarPujaAsync(int subastaId, CrearPujaRequest request)
    {
        try
        {
            return await EjecutarPujaAsync(subastaId, request);
        }
        catch (BusinessRuleException ex)
        {
            await RegistrarRechazoAsync(subastaId, request, ex.Message);
            throw;
        }
        catch (NotFoundException ex)
        {
            await RegistrarRechazoAsync(subastaId, request, ex.Message);
            throw;
        }
        catch (ConcurrencyConflictException ex)
        {
            await RegistrarRechazoAsync(subastaId, request, ex.Message);
            throw;
        }
    }

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
            fueAntiSniping = true;
            subasta.FechaFin = subasta.FechaFin.AddMinutes(ExtensionAntiSnipingMinutos);
            nuevaFechaFin = subasta.FechaFin;
            
            // Registro de puja nueva en tiempo critico en Subasta.
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

        subasta.Version++;

        // 10. Persistir cambios de forma atómica
        await _pujaRepository.GuardarCambiosAsync();

        return new PujaResponse
        {
            PujaId = nuevaPuja.Id,
            SubastaId = subasta.Id,
            CompradorId = nuevaPuja.CompradorId,
            Monto = nuevaPuja.Monto,
            FechaPuja = nuevaPuja.FechaPuja,
            FueAntiSniping = fueAntiSniping,
            NuevaFechaFin = nuevaFechaFin
        };
    }

    private async Task RegistrarRechazoAsync(int subastaId, CrearPujaRequest request, string motivo)
    {
        var auditoria = new AuditoriaLog
        {
            Entidad = nameof(Puja),
            EntidadId = subastaId,
            Accion = "PujaRechazada",
            UsuarioId = request.CompradorId,
            DetalleJson = JsonSerializer.Serialize(new { Motivo = motivo, Monto = request.Monto }),
            Fecha = DateTime.UtcNow
        };
        _pujaRepository.AgregarAuditoria(auditoria);
        await _pujaRepository.GuardarCambiosAsync();
    }
}