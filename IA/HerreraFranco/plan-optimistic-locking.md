# Plan de Implementación: Optimistic Locking + Manejo de 409 Conflict & Test en Postman

## Objetivo
Garantizar la integridad transaccional y la prevención de colisiones mediante **Optimistic Locking** (bloqueo optimista) utilizando el campo `Version` con el atributo `[ConcurrencyCheck]`. Asegurar que ante intentos simultáneos de modificación sobre el mismo recurso, el sistema responda con **`HTTP 409 Conflict`** (evitando errores genéricos 500). Proveer la prueba de concurrencia en **Postman** (exportable en JSON) y documentar el mecanismo para la entrega (Sección 4.1 de la práctica).

---

## Rama de Trabajo
- **Nombre aprobado:** `feature/optimistic-locking`
- **Punto de partida:** `dev`

---

## Componentes a Implementar

### Componente 1: Extensión de Optimistic Locking a Billetera (`Wallet`)

Actualmente `Billetera` tiene `[ConcurrencyCheck] public int Version { get; set; }` en la base de datos, pero el repositorio no atrapa `DbUpdateConcurrencyException` y el controlador no maneja `409 Conflict`.

#### [MODIFY] `SubastaYa/Repositories/BilleteraRepository.cs`
- En `GuardarCambiosAsync()`, capturar `DbUpdateConcurrencyException`.
- Limpiar el tracker de EF Core (`_context.ChangeTracker.Clear()`) para no dejar el contexto sucio.
- Lanzar `ConcurrencyConflictException`.

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
            "Conflicto de concurrencia: la billetera fue modificada simultáneamente por otra operación. Por favor, intente nuevamente.");
    }
}
```

#### [MODIFY] `SubastaYa/Services/BilleteraService.cs`
- En `DepositarAsync`, incrementar la versión de la billetera (`billetera.Version++`) para activar la verificación de concurrencia de EF Core al momento de persistir el depósito.

```csharp
// En DepositarAsync:
billetera.SaldoTotal += request.monto;
billetera.SaldoDisponible += request.monto;
billetera.Version++; // <-- Incremento para forzar validación de versión
```

#### [MODIFY] `SubastaYa/Controllers/WalletController.cs`
- Capturar `ConcurrencyConflictException` en el endpoint `POST /api/wallet/deposit`.
- Documentar el código con `[ProducesResponseType(StatusCodes.Status409Conflict)]`.

```csharp
[HttpPost("deposit")]
[ProducesResponseType(typeof(BalanceResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
[ProducesResponseType(StatusCodes.Status409Conflict)]
public async Task<IActionResult> Depositar([FromBody] DepositarRequest request)
{
    try
    {
        var resultado = await _billeteraService.DepositarAsync(request);
        return Ok(resultado);
    }
    catch (NotFoundException ex)
    {
        return NotFound(new { mensaje = ex.Message });
    }
    catch (BusinessRuleException ex)
    {
        return BadRequest(new { mensaje = ex.Message });
    }
    catch (ConcurrencyConflictException ex)
    {
        return Conflict(new { mensaje = ex.Message });
    }
}
```

---

### Componente 2: Prueba de Concurrencia en Postman (JSON)

Para cumplir con la Sección 4.1 de la práctica (*"demostrar que si se envían dos peticiones de puja idénticas en el mismo milisegundo, la base de datos registra solo una y rechaza la otra con 409 Conflict"*):

#### [NEW / UPDATE] Request en la Colección de Postman
Agregamos una nueva carpeta `⚡ Concurrencia` en la colección de Postman con la petición:
**`POST /api/auctions/1/bids - Test Concurrencia (Pujas Simultáneas)`**

En la pestaña **Tests** de Postman, usamos `pm.sendRequest` asincrónico para disparar dos peticiones idénticas en paralelo:

```javascript
// Postman Tests Script: Disparo en paralelo
const url = pm.variables.get("baseUrl") + "/api/auctions/1/bids";
const body = JSON.stringify({
    compradorId: 3,
    monto: 60000
});

const requestConfig = {
    url: url,
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: { mode: 'raw', raw: body }
};

let responses = [];

function checkResults() {
    if (responses.length === 2) {
        const codes = responses.map(r => r.code);
        
        pm.test("Una petición fue ACEPTADA con 201 Created", function () {
            pm.expect(codes).to.include(201);
        });

        pm.test("La otra petición fue RECHAZADA por concurrencia con 409 Conflict", function () {
            pm.expect(codes).to.include(409);
        });

        const conflictRes = responses.find(r => r.code === 409);
        if (conflictRes) {
            pm.test("El error 409 contiene mensaje de conflicto de concurrencia", function () {
                const json = conflictRes.json();
                pm.expect(json.mensaje).to.include("concurrencia");
            });
        }
    }
}

// Disparo simultáneo en el mismo ciclo de eventos
pm.sendRequest(requestConfig, function (err, res) {
    responses.push(res);
    checkResults();
});

pm.sendRequest(requestConfig, function (err, res) {
    responses.push(res);
    checkResults();
});
```

Al darle a **Send** en Postman:
- Se envían ambas peticiones en el mismo milisegundo.
- La pestaña **Test Results** muestra los 3 tests en verde (`PASS`).
- Se puede exportar el archivo de resultados `postman_test_run.json` para adjuntarlo a la entrega.

---

### Componente 3: Documentación para la Entrega (README.md)

Redactar en el `README.md` la sección exigida por la cátedra (4.1):
- Explicación de cómo funciona el bloqueo optimista con `[ConcurrencyCheck]`.
- Explicación de la detección de colisiones en PostgreSQL (`UPDATE ... WHERE version = N`).
- Paso a paso de cómo importar y ejecutar la prueba de concurrencia en Postman para verificar el `409 Conflict`.

---

## Plan de Verificación

1. **Compilación:** `dotnet build` sin errores ni warnings.
2. **Reinicio de Base de Datos:** `docker compose down -v && docker compose up -d` para tener datos frescos.
3. **Ejecución en Postman:**
   - Correr la petición de concurrencia.
   - Verificar que devuelve 201 en una y 409 en la otra.
   - Correr `POST /api/wallet/deposit` y verificar su funcionamiento normal y su protección contra colisiones.
