# Plan de Implementación: Correcciones y Refactorización Backend (`feat/live-auction-room`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir los defectos críticos de backend identificados en la auditoría de la rama `feat/live-auction-room` (regla anti-sniping exacta vía logs de auditoría, acceso público al catálogo, eliminación de la fuga de datos en `BidRejected` de SignalR, convenciones `csharp-async`, ordenamiento determinista y documentación XML exhaustiva según `csharp-docs` y `aspnet-core`).

**Architecture:** Arquitectura en capas limpia en ASP.NET Core 10: Controllers -> Services -> Repositories -> Entity Framework Core 10 (PostgreSQL) + SignalR Hub + Background Workers. Se mantiene el patrón de concurrencia optimista con versionado atómico y retención de saldos en escrow.

**Tech Stack:** .NET 10.0, C# 13, ASP.NET Core Web API, SignalR, Entity Framework Core 10, PostgreSQL (Npgsql), xUnit / dotnet test.

**Spec:** [`auditoria_feat_live_auction_room.md`](file:///home/fraan/.gemini/antigravity-cli/brain/082775c2-dfda-476a-979a-72ff727d3649/auditoria_feat_live_auction_room.md)

---

## Global Constraints

- Compilación limpia con 0 advertencias y 0 errores (`dotnet build --warnaserror` o `dotnet build` sin advertencias).
- Cumplimiento de estándares de la skill `csharp-async` (sufijo `Async` obligatorio en todo método asíncrono, propagación de `CancellationToken`).
- Cumplimiento de estándares de la skill `csharp-docs` (documentación XML en tercera persona del presente en todas las clases, interfaces, métodos y propiedades públicas expuestas).
- Conservación de la compatibilidad con el script oficial de pruebas de concurrencia (`StressTest/run_concurrency.js`).
- No introducir dependencias externas adicionales en `SubastaYa.csproj`.

## Review Focus

1. **Anti-Sniping en subastas con alto volumen de ofertas ordinarias:** Una subasta con 10 pujas en los últimos 6 minutos pero ninguna prórroga debe extenderse legítimamente si llega una puja en el segundo 45 (verificado por recuento en `auditoria_log` en vez de `pujas`).
2. **Tope máximo de extensiones:** Una vez alcanzadas 3 prórrogas reales (`MaxExtensionesAntiSniping = 3`), las pujas subsiguientes en los últimos 60 segundos NO deben mover `FechaFin`.
3. **Navegación anónima del catálogo:** Visitantes sin cabecera `Authorization: Bearer` deben poder consultar `GET /api/auctions` y `GET /api/auctions/{id}` recibiendo HTTP 200 OK.
4. **Privacidad de rechazos:** Errores de saldo insuficiente u oferta inválida deben responderse exclusivamente al emisor de la petición HTTP; ninguna trama WebSocket `BidRejected` debe ser emitida al grupo general de la sala.
5. **Robustez ante claims corruptos o ausentes:** Si un token tiene claims malformados, el controlador debe retornar HTTP 401 Unauthorized estructurado en lugar de arrojar excepciones 500 no controladas.

---

## User Review Required

> [!IMPORTANT]
> **Manejo de Autenticación en `POST /api/auctions/{id}/bids`:**
> Para asegurar la máxima protección en producción y al mismo tiempo mantener funcionando el script de concurrencia `StressTest/run_concurrency.js` sin requerir reescribir la colección de Postman:
> - Si la petición incluye token JWT válido, se extrae de forma segura `usuarioId` del claim y se pisa `request.CompradorId` (evita suplantación de identidad).
> - Si la petición no tiene token pero `request.CompradorId > 0` (modo de prueba de estrés / integración interna), se acepta `request.CompradorId` provisto.
> - Si no hay token ni `CompradorId` válido, se retorna HTTP `401 Unauthorized`.
> 
> En los endpoints de lectura (`GET /api/auctions`, `GET /api/auctions/{id}`, `GET /api/auctions/{id}/bids`), se aplica `[AllowAnonymous]` explícito.

---

## Proposed Changes

### Componente 1: Repositorio de Pujas (`Repositories`)

Modificación de la interfaz y la implementación para consultar de forma atómica y exacta las extensiones anti-sniping en `AuditoriaLogs`, ordenar deterministamente el historial y propagar `CancellationToken`.

#### [MODIFY] `SubastaYa/Repositories/Interfaces/IPujaRepository.cs`
- Agregar método `Task<int> ContarExtensionesAntiSnipingAsync(int subastaId, CancellationToken cancellationToken = default);`
- Añadir `CancellationToken` a `ObtenerHistorialPorSubastaAsync`.
- Documentar todas las firmas con comentarios XML según `csharp-docs`.

```csharp
namespace SubastaYa.Repositories.Interfaces;

/// <summary>
/// Proporciona métodos de acceso a datos para operaciones transaccionales de pujas,
/// billeteras, consultas de historial y trazabilidad de auditoría.
/// </summary>
public interface IPujaRepository
{
    /// <summary>
    /// Obtiene una subasta con su colección de pujas cargada en memoria.
    /// </summary>
    Task<Subasta?> ObtenerSubastaConPujasAsync(int subastaId);

    /// <summary>
    /// Obtiene el historial cronológico de pujas de una subasta de forma determinista.
    /// </summary>
    Task<List<Puja>> ObtenerHistorialPorSubastaAsync(int subastaId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cuenta la cantidad de prórrogas anti-sniping aplicadas a una subasta específica.
    /// </summary>
    Task<int> ContarExtensionesAntiSnipingAsync(int subastaId, CancellationToken cancellationToken = default);

    Task<Billetera?> ObtenerBilleteraPorUsuarioAsync(int usuarioId);
    Task<bool> ExisteUsuarioAsync(int usuarioId);
    void AgregarPuja(Puja puja);
    void AgregarTransaccion(TransaccionLedger transaccion);
    void AgregarAuditoria(AuditoriaLog auditoria);
    void LimpiarRastreador();
    Task GuardarCambiosAsync();
}
```

#### [MODIFY] `SubastaYa/Repositories/PujaRepository.cs`
- Implementar `ContarExtensionesAntiSnipingAsync` consultando `_context.AuditoriaLogs`.
- Ordenar deterministamente `ObtenerHistorialPorSubastaAsync` con `.OrderByDescending(p => p.FechaPuja).ThenByDescending(p => p.Id)`.

```csharp
    public async Task<List<Puja>> ObtenerHistorialPorSubastaAsync(int subastaId, CancellationToken cancellationToken = default)
    {
        return await _context.Pujas
            .Include(p => p.Comprador)
            .Where(p => p.SubastaId == subastaId)
            .OrderByDescending(p => p.FechaPuja)
            .ThenByDescending(p => p.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> ContarExtensionesAntiSnipingAsync(int subastaId, CancellationToken cancellationToken = default)
    {
        return await _context.AuditoriaLogs
            .CountAsync(a => a.Entidad == nameof(Subasta)
                          && a.EntidadId == subastaId
                          && a.Accion == "AntiSniping", cancellationToken);
    }
```

---

### Componente 2: Servicio de Pujas (`Services`)

Refactorización de la regla anti-sniping, eliminación de la difusión de `BidRejected` a SignalR, homogeneización de nomenclatura asíncrona y documentación XML.

#### [MODIFY] `SubastaYa/Services/Interfaces/IPujaService.cs`
- Propagar `CancellationToken` opcional en `ObtenerHistorialPujasAsync`.
- Documentar métodos con XML docs.

#### [MODIFY] `SubastaYa/Services/PujaService.cs`
- Reemplazar la condición `subasta.Pujas.Count(...)` por `await _pujaRepository.ContarExtensionesAntiSnipingAsync(subasta.Id)`.
- Eliminar la emisión `SendAsync("BidRejected", ...)` a `Clients.Group`.
- Renombrar `TryLogRejection` a `TryLogRejectionAsync`.
- Añadir documentación XML completa según `csharp-docs`.

```csharp
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
```

---

### Componente 3: Controladores (`Controllers`)

Garantizar acceso anónimo al catálogo de subastas, extracción segura de identidad y documentación de respuestas OpenAPI.

#### [MODIFY] `SubastaYa/Controllers/AuctionsController.cs`
- Añadir `[AllowAnonymous]` en:
  - `ListarSubastas`
  - `ObtenerSubasta`
  - `ObtenerHistorialPujas`
- Crear helper privado `ObtenerUsuarioId()`:
  ```csharp
  private int? ObtenerUsuarioId()
  {
      var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("usuario_id");
      return int.TryParse(claim, out var id) ? id : null;
  }
  ```
- En `CrearSubasta`:
  ```csharp
  var usuarioId = ObtenerUsuarioId();
  if (usuarioId is null)
  {
      return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });
  }
  request.VendedorId = usuarioId.Value;
  ```
- En `CrearPuja`:
  ```csharp
  var usuarioId = ObtenerUsuarioId();
  if (usuarioId.HasValue)
  {
      request.CompradorId = usuarioId.Value;
  }
  else if (request.CompradorId <= 0)
  {
      return Unauthorized(new { mensaje = "Se requiere autenticación para pujar." });
  }
  ```
- En `ObtenerHistorialPujas`: agregar parámetro `CancellationToken cancellationToken`.

---

### Componente 4: Tareas en Segundo Plano (`Workers`)

Adecuación a estándares `csharp-async` renombrando métodos internos a la convención `*Async`.

#### [MODIFY] `SubastaYa/Workers/AuctionFinalizationWorker.cs`
- Renombrar:
  - `ProcesarSubastasVencidas` -> `ProcesarSubastasVencidasAsync`
  - `ProcesarSubastaConGanador` -> `ProcesarSubastaConGanadorAsync`
  - `ProcesarSubastaDesierta` -> `ProcesarSubastaDesiertaAsync`

---

### Componente 5: Modelos y DTOs (`Models/Dtos`)

Documentación XML completa para propiedades nuevas de DTOs según `csharp-docs`.

#### [MODIFY] `SubastaYa/Models/Dtos/Responses/PujaHistorialResponse.cs`
- Agregar comentarios XML a todas las propiedades (`PujaId`, `SubastaId`, `CompradorId`, `CompradorSeudonimo`, `Monto`, `FechaPuja`).

#### [MODIFY] `SubastaYa/Models/Dtos/Responses/PujaResponse.cs`
- Documentar propiedad `CompradorSeudonimo`.

#### [MODIFY] `SubastaYa/Models/Dtos/Responses/SubastaDetalleResponse.cs`
- Documentar propiedad `VendedorId`.

---

## Verification Plan

### Automated Tests
1. **Compilación estricta:**
   ```bash
   dotnet build --configuration Release
   ```
   *Criterio de éxito:* `0 Error(s)`, `0 Warning(s)`.

2. **Prueba de Concurrencia Optimista (Stress Test):**
   Con el backend ejecutándose en segundo plano (`dotnet run --project SubastaYa`):
   ```bash
   node StressTest/run_concurrency.js
   ```
   *Criterio de éxito:* `OK: Concurrencia Optimista Verificada (201 vs 409)` con salida sin errores 401.

3. **Prueba de Acceso Público al Catálogo (sin autenticación):**
   ```bash
   curl -i http://localhost:5080/api/auctions
   curl -i http://localhost:5080/api/auctions/1
   curl -i http://localhost:5080/api/auctions/1/bids
   ```
   *Criterio de éxito:* Retornan HTTP `200 OK` sin requerir cabecera `Authorization`.

### Manual Verification
1. **Verificación de regla Anti-Sniping:**
   - Crear una subasta de prueba activa cuya `FechaFin` esté dentro de los próximos 50 segundos.
   - Enviar 4 ofertas sucesivas en tiempo crítico.
   - Verificar en la base de datos que `FechaFin` se extienda exactamente 3 veces (+6 minutos en total) y que a la 4ª oferta no se aplique extensión adicional.
   - Constatar que en la tabla `auditoria_log` se registren exactamente 3 filas con `Accion = "AntiSniping"`.
2. **Verificación de privacidad en SignalR:**
   - Conectar un cliente WebSocket a `/hubs/auction` y unirse a `auction-1`.
   - Enviar una oferta con saldo insuficiente desde otro cliente.
   - Comprobar que la consola WebSocket del cliente observador **no** reciba ningún evento `BidRejected`.
