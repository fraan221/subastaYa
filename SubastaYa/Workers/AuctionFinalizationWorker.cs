using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Hubs;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;

namespace SubastaYa.Workers;

public class AuctionFinalizationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AuctionFinalizationWorker> _logger;
    private readonly TimeSpan _intervalo = TimeSpan.FromSeconds(30);

    public AuctionFinalizationWorker(
        IServiceProvider serviceProvider,
        ILogger<AuctionFinalizationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AuctionFinalizationWorker iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarSubastasVencidas(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error procesando subastas vencidas.");
            }

            await Task.Delay(_intervalo, stoppingToken);
        }
    }

    private async Task ProcesarSubastasVencidas(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hubContext = scope.ServiceProvider
            .GetRequiredService<IHubContext<AuctionHub>>();

        var ahora = DateTime.UtcNow;

        await ActivarSubastasProgramadasAsync(
            context,
            hubContext,
            ahora,
            ct);

        var subastasVencidas = await context.Subastas
            .Include(s => s.Pujas)
            .Where(s => s.Estado == EstadoSubasta.Activa
                        && s.FechaFin <= ahora)
            .ToListAsync(ct);

        foreach (var subasta in subastasVencidas)
        {
            try
            {
                if (subasta.Pujas.Any())
                {
                    await ProcesarSubastaConGanador(
                        subasta, hubContext, ahora, context, ct);
                }
                else
                {
                    await ProcesarSubastaDesierta(
                        subasta, hubContext, ahora, context, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error procesando subasta {SubastaId}.", subasta.Id);
            }
        }
    }
    //Activar subastas programadas.
    private async Task ActivarSubastasProgramadasAsync(
        AppDbContext context,
        IHubContext<AuctionHub> hubContext,
        DateTime ahora,
        CancellationToken ct)
    {
        var subastasParaActivar = await context.Subastas
            .Where(s => s.Estado == EstadoSubasta.Programada
                     && s.FechaInicio <= ahora)
            .ToListAsync(ct);

        if (subastasParaActivar.Count == 0)
        {
            return;
        }

        foreach (var subasta in subastasParaActivar)
        {
            subasta.Estado = EstadoSubasta.Activa;
            subasta.Version++;
        }

        await context.SaveChangesAsync(ct);

        foreach (var subasta in subastasParaActivar)
        {
            try
            {
                await hubContext.Clients
                    .Group($"auction-{subasta.Id}")
                    .SendAsync("AuctionStarted", new
                    {
                        SubastaId = subasta.Id,
                        Estado = EstadoSubasta.Activa.ToString(),
                        FechaInicio = subasta.FechaInicio,
                        FechaFin = subasta.FechaFin
                    }, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "La subasta {SubastaId} fue activada, " +
                    "pero no se pudo enviar la notificacion.",
                    subasta.Id);
            }
        }
    }

    private async Task ProcesarSubastaConGanador(
        Subasta subasta,
        IHubContext<AuctionHub> hubContext,
        DateTime ahora,
        AppDbContext context,
        CancellationToken ct)
    {
        var pujaGanadora = subasta.Pujas
            .OrderByDescending(p => p.Monto)
            .ThenByDescending(p => p.FechaPuja)
            .First();

        var billeteraComprador = await context.Billeteras
            .FirstOrDefaultAsync(
                b => b.UsuarioId == pujaGanadora.CompradorId, ct);

        var billeteraVendedor = await context.Billeteras
            .FirstOrDefaultAsync(
                b => b.UsuarioId == subasta.VendedorId, ct);

        if (billeteraComprador is null || billeteraVendedor is null)
        {
            _logger.LogError(
                "No se puede finalizar la subasta {SubastaId}: falta la billetera del comprador o del vendedor.",
                subasta.Id);

            return;
        }

        subasta.Estado = EstadoSubasta.Finalizada;
        subasta.Version++;

        // Comprador
        billeteraComprador.SaldoRetenido -= pujaGanadora.Monto;
        billeteraComprador.SaldoTotal -= pujaGanadora.Monto;
        billeteraComprador.Version++;

        // Vendedor
        billeteraVendedor.SaldoDisponible += pujaGanadora.Monto;
        billeteraVendedor.SaldoTotal += pujaGanadora.Monto;
        billeteraVendedor.Version++;

        // Comprador
        context.TransaccionLedgers.Add(new TransaccionLedger
        {
            BilleteraId = billeteraComprador.Id,
            Tipo = TipoTransaccion.Pago,
            Monto = pujaGanadora.Monto,
            Fecha = ahora,
            SubastaId = subasta.Id
        });

        // Vendedor
        context.TransaccionLedgers.Add(new TransaccionLedger
        {
            BilleteraId = billeteraVendedor.Id,
            Tipo = TipoTransaccion.Cobro,
            Monto = pujaGanadora.Monto,
            Fecha = ahora,
            SubastaId = subasta.Id
        });

        context.AuditoriaLogs.Add(new AuditoriaLog
        {
            Entidad = nameof(Subasta),
            EntidadId = subasta.Id,
            Accion = "SubastaFinalizada",
            UsuarioId = pujaGanadora.CompradorId,
            DetalleJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                GanadorId = pujaGanadora.CompradorId,
                MontoFinal = pujaGanadora.Monto,
                TotalPujas = subasta.Pujas.Count
            }),
            Fecha = ahora
        });

        await context.SaveChangesAsync(ct);

        await hubContext.Clients
            .Group($"auction-{subasta.Id}")
            .SendAsync("AuctionFinalized", new
            {
                SubastaId = subasta.Id,
                Estado = "Finalizada",
                GanadorId = pujaGanadora.CompradorId,
                MontoFinal = pujaGanadora.Monto
            }, ct);

        _logger.LogInformation(
            "Subasta {SubastaId} FINALIZADA. Ganador: {GanadorId}, Monto: {Monto}",
            subasta.Id, pujaGanadora.CompradorId, pujaGanadora.Monto);
    }

    private async Task ProcesarSubastaDesierta(
        Subasta subasta,
        IHubContext<AuctionHub> hubContext,
        DateTime ahora,
        AppDbContext context,
        CancellationToken ct)
    {
        subasta.Estado = EstadoSubasta.Desierta;
        subasta.Version++;

        context.AuditoriaLogs.Add(new AuditoriaLog
        {
            Entidad = nameof(Subasta),
            EntidadId = subasta.Id,
            Accion = "SubastaDesierta",
            UsuarioId = subasta.VendedorId,
            DetalleJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                Mensaje = "Subasta vencida sin pujas"
            }),
            Fecha = ahora
        });

        await context.SaveChangesAsync(ct);

        await hubContext.Clients
            .Group($"auction-{subasta.Id}")
            .SendAsync("AuctionDeserted", new
            {
                SubastaId = subasta.Id,
                Estado = "Desierta"
            }, ct);

        _logger.LogInformation(
            "Subasta {SubastaId} marcada como DESIERTA.", subasta.Id);
    }
}
