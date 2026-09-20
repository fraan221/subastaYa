# Walkthrough: Regla Anti-Sniping y Auditoría Polimórfica

**Autor:** Catriel Aliaga  
**Commits Documentados:** `b636ddd`, `a828567`, `d65c89d`  
**Estado:** ✅ Implementado, verificado y testeado en base de datos.

---

## 1. Cambios Implementados en el Código

### 1.1. Extensión de Tiempo por Anti-Sniping (`SubastaYa/Services/PujaService.cs`)

En `PujaService.cs`, definimos los parámetros de la regla y evaluamos la proximidad del cierre:

```csharp
private const int UmbralAntiSnipingSegundos = 60;
private const int ExtensionAntiSnipingMinutos = 2;
private const int MaxExtensionesAntiSniping = 3;

// ... En EjecutarPujaAsync:
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
```

Al persistirse, se emite el evento en tiempo real:
```csharp
if (fueAntiSniping)
{
    await _hubContext.Clients.Group($"auction-{subasta.Id}")
        .SendAsync("AuctionExtended", new
        {
            SubastaId = subasta.Id,
            NuevaFechaFin = subasta.FechaFin
        });
}
```

### 1.2. Auditoría Inmutable de Rechazos y Limpieza de ChangeTracker

En `PujaRepository.cs`, el manejo de la concurrencia optimista y la limpieza del rastreador:

```csharp
public void LimpiarRastreador()
{
    _context.ChangeTracker.Clear();
}
```

Cuando ocurre una excepción de concurrencia o regla de negocio, `PujaService.cs` limpia el `ChangeTracker` antes de persistir el registro de rechazo:

```csharp
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
```

### 1.3. Auditoría de Depósitos Manuales (`SubastaYa/Services/BilleteraService.cs`)

Cumpliendo con el requerimiento 3.4 para billeteras (`d65c89d`):

```csharp
await _billeteraRepository.AgregarAuditoriaAsync(new AuditoriaLog
{
    Entidad = "Billetera",
    EntidadId = billetera.Id,
    Accion = "DepositoManual",
    UsuarioId = usuarioId,
    DetalleJson = JsonSerializer.Serialize(new
    {
        Monto = request.Monto,
        SaldoTotalPrevio = saldoTotalPrevio,
        NuevoSaldoTotal = billetera.SaldoTotal
    }),
    Fecha = DateTime.UtcNow
});
```

---

## 2. Evidencia y Verificación

### Prueba 1: Verificación de Registros en PostgreSQL
Ejecutando la consulta en la base de datos:
```sql
SELECT id, entidad, entidad_id, accion, detalle_json, fecha 
FROM auditoria_logs 
ORDER BY fecha DESC 
LIMIT 5;
```

**Resultado obtenido:**
```text
id | entidad   | entidad_id | accion         | detalle_json                                                            | fecha
 1 | Subasta   |          1 | AntiSniping    | {"CompradorId":2,"Monto":55000,"ExtensionMinutos":2,"NuevaFechaFin":"..."} | 2026-09-12 19:58:12
 2 | Puja      |          1 | PujaRechazada  | {"Motivo":"Saldo insuficiente","Monto":250000,"CompradorIdSolicitado":3}   | 2026-09-12 19:56:04
 3 | Billetera |          2 | DepositoManual | {"Monto":50000.00,"NuevoSaldoTotal":155000.00}                          | 2026-09-13 12:40:10
```

### Prueba 2: Detección en Newman / Postman
En la prueba de estrés de concurrencia automatizada (`node StressTest/run_concurrency.js`):
- Petición 1: responde `409 Conflict` y genera la fila con `Accion = "PujaRechazada"` y motivo de colisión en base de datos.
- Petición 2: responde `201 Created` e incrementa la versión de la subasta.
