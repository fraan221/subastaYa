# Walkthrough: Escrow Financiero y Motor de Pujas Concurrentes

**Autor:** Catriel Aliaga  
**Commit:** [`f8802d6`](https://github.com/fraan221/subastaYa/commit/f8802d6) — *feat: add POST bids endpoint with escrow and optimistic locking*  
**Archivos Afectados:**
- `SubastaYa/Controllers/AuctionsController.cs`
- `SubastaYa/Services/PujaService.cs` & `IPujaService.cs`
- `SubastaYa/Repositories/PujaRepository.cs` & `IPujaRepository.cs`
- `SubastaYa/Models/Dtos/Requests/CrearPujaRequest.cs`
- `SubastaYa/Models/Dtos/Responses/PujaResponse.cs`

---

## 1. Implementación Técnica Realizada

### 1.1. Manejo de Concurrencia en `PujaRepository.cs`
Captura de `DbUpdateConcurrencyException` para limpiar el `ChangeTracker` y lanzar la excepción de dominio `ConcurrencyConflictException`:
```csharp
public async Task GuardarCambiosAsync()
{
    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateConcurrencyException)
    {
        _context.ChangeTracker.Clear();
        throw new ConcurrencyConflictException(
            "Conflicto de concurrencia: otro usuario modificó los datos simultáneamente. Por favor, intentá nuevamente.");
    }
}
```

### 1.2. Transacción Atómica de Escrow en `PujaService.cs`
Se implementó el ciclo de vida completo de garantía financiera:
```csharp
// 1. Retener saldo del nuevo comprador
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

// 2. Liberar saldo retenido al comprador anterior (si existía oferta previa)
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

// 3. Crear puja y avanzar versión de la subasta
var nuevaPuja = new Puja
{
    SubastaId = subasta.Id,
    CompradorId = request.CompradorId,
    Monto = request.Monto,
    FechaPuja = ahora
};
_pujaRepository.AgregarPuja(nuevaPuja);
subasta.Version++;

await _pujaRepository.GuardarCambiosAsync();
```

### 1.3. Exposición en `AuctionsController.cs`
Mapeo semántico al estándar HTTP:
- Éxito: Retorna `HTTP 201 Created` con el DTO `PujaResponse`.
- Concurrencia optimista: Captura `ConcurrencyConflictException` y responde `HTTP 409 Conflict`.
- Regla de negocio rota: Responde `HTTP 400 BadRequest`.
- No encontrado: Responde `HTTP 404 NotFound`.

---

## 2. Pruebas de Verificación y Estrés

1. **Garantía de Fondos:** Un comprador con $10.000 disponibles intenta ofertar $15.000: la API responde `HTTP 400 BadRequest` con mensaje descriptivo y no genera mutación de datos.
2. **Carrera de Dos Ofertas Simultáneas:** Se ejecuta `node StressTest/run_concurrency.js` contra una misma subasta con dos peticiones enviadas en el mismo instante:
   - Petición 1: `HTTP 201 Created`.
   - Petición 2: `HTTP 409 Conflict`.
3. **Invariante Contable:** El libro diario `transaccion_ledgers` registra exactamente una retención para el postor líder actual y libera las ofertas superadas, garantizando $\text{SaldoTotal} = \text{SaldoDisponible} + \text{SaldoRetenido}$.
