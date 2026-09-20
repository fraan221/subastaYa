# Walkthrough: Background Worker de Cierre y Liquidación de Subastas

**Autor:** Catriel Aliaga  
**Commits Documentados:** `7d60e65`, `6f06230`, `8a818e2`, `c605b31`  
**Estado:** ✅ Operativo en segundo plano en ASP.NET Core y verificado con base de datos.

---

## 1. Código Principal y Decisiones de Diseño

### 1.1. Inyección de Ámbitos (Scoped Services dentro de Singleton Worker)
`AuctionFinalizationWorker` es registrado como un `Singleton` (`IHostedService`). Como `AppDbContext` es un servicio `Scoped`, no puede inyectarse directamente en el constructor del worker. En su lugar, utilizamos `IServiceProvider.CreateScope()` en cada tick del bucle cada 30 segundos:

```csharp
public class AuctionFinalizationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AuctionFinalizationWorker> _logger;
    private readonly TimeSpan _intervalo = TimeSpan.FromSeconds(30);

    // ...
    private async Task ProcesarSubastasVencidasAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<AuctionHub>>();

        var ahora = DateTime.UtcNow;
        await ActivarSubastasProgramadasAsync(context, hubContext, ahora, ct);

        var subastasVencidas = await context.Subastas
            .Include(s => s.Pujas)
            .Where(s => s.Estado == EstadoSubasta.Activa && s.FechaFin <= ahora)
            .ToListAsync(ct);

        foreach (var subasta in subastasVencidas)
        {
            if (subasta.Pujas.Any())
                await ProcesarSubastaConGanadorAsync(subasta, hubContext, ahora, context, ct);
            else
                await ProcesarSubastaDesiertaAsync(subasta, hubContext, ahora, context, ct);
        }
    }
}
```

### 1.2. Asentamiento Contable Atómico y Liquidación Financiera
En `ProcesarSubastaConGanadorAsync`, realizamos la transferencia de fondos y el asentamiento en el libro mayor (`TransaccionLedger`):

```csharp
subasta.Estado = EstadoSubasta.Finalizada;
subasta.Version++;

// 1. Débito definitivo del ganador
billeteraComprador.SaldoRetenido -= pujaGanadora.Monto;
billeteraComprador.SaldoTotal -= pujaGanadora.Monto;
billeteraComprador.Version++;

// 2. Crédito disponible para el vendedor
billeteraVendedor.SaldoDisponible += pujaGanadora.Monto;
billeteraVendedor.SaldoTotal += pujaGanadora.Monto;
billeteraVendedor.Version++;

// 3. Registro en el Ledger Contable
context.TransaccionLedgers.Add(new TransaccionLedger
{
    BilleteraId = billeteraComprador.Id,
    Tipo = TipoTransaccion.Pago,
    Monto = pujaGanadora.Monto,
    Fecha = ahora,
    SubastaId = subasta.Id
});

context.TransaccionLedgers.Add(new TransaccionLedger
{
    BilleteraId = billeteraVendedor.Id,
    Tipo = TipoTransaccion.Cobro,
    Monto = pujaGanadora.Monto,
    Fecha = ahora,
    SubastaId = subasta.Id
});

// 4. Registro de Auditoría
context.AuditoriaLogs.Add(new AuditoriaLog
{
    Entidad = nameof(Subasta),
    EntidadId = subasta.Id,
    Accion = "SubastaFinalizada",
    UsuarioId = pujaGanadora.CompradorId,
    DetalleJson = JsonSerializer.Serialize(new
    {
        GanadorId = pujaGanadora.CompradorId,
        MontoFinal = pujaGanadora.Monto,
        TotalPujas = subasta.Pujas.Count
    }),
    Fecha = ahora
});

await context.SaveChangesAsync(ct);
```

### 1.3. Emisión de Notificación en Vivo por WebSockets
Una vez confirmada la persistencia en base de datos, notificamos a todos los clientes suscritos al canal WebSocket:

```csharp
// Cuando hay ganador:
await hubContext.Clients.Group($"auction-{subasta.Id}").SendAsync("AuctionFinalized", new
{
    SubastaId = subasta.Id,
    Estado = "Finalizada",
    GanadorId = pujaGanadora.CompradorId,
    MontoFinal = pujaGanadora.Monto
}, ct);

// Cuando finaliza sin postores (Desierta):
await hubContext.Clients.Group($"auction-{subasta.Id}").SendAsync("AuctionDeserted", new
{
    SubastaId = subasta.Id,
    Estado = "Desierta"
}, ct);
```

---

## 2. Verificación en Entorno Real

### Caso 1: Finalización con Ganador
1. Se configuró una subasta con puja ganadora de $45.000.
2. Al vencer la `FechaFin`, el worker registró en los logs:
   ```text
   info: SubastaYa.Workers.AuctionFinalizationWorker[0]
         Subasta 5 FINALIZADA. Ganador: 3, Monto: 45000.00
   ```
3. Comprobación en base de datos:
   - `subastas.estado`: pasó a `Finalizada`.
   - `billeteras` (usuario 3): `saldo_retenido` se redujo en $45.000, `saldo_total` se redujo en $45.000.
   - `billeteras` (usuario vendedor): `saldo_disponible` se incrementó en $45.000, `saldo_total` se incrementó en $45.000.
   - `transaccion_ledgers`: 2 nuevas filas (`Pago` y `Cobro`).
   - `auditoria_logs`: 1 fila con `Accion = "SubastaFinalizada"`.

### Caso 2: Subasta sin Ofertas (Desierta)
1. Subasta finalizada sin ninguna puja registrada.
2. El worker la transicionó a `EstadoSubasta.Desierta`, emitió `AuctionDeserted` y registró `SubastaDesierta` en auditoría sin tocar balances.
