# Walkthrough: API de Catálogo, Filtros y Alta de Subastas

**Autor:** Catriel Aliaga  
**Commits Documentados:**
- `8c40385`: *feat: add create auction endpoint with validation*
- `c6f2a2e`: *feat: add GET auctions listing endpoint with pagination and filters*
- `9da493a`: *feat: add GET auction detail endpoint with current bid*  
**Estado:** ✅ Implementado, verificado y testeado en Swagger y frontend.

---

## 1. Implementación Técnica Realizada

### 1.1. Creación de Subasta con Seguridad y Validación (`AuctionsController.cs`)

El endpoint `POST /api/auctions` extrae el `usuarioId` directamente desde los claims del token JWT, impidiendo la suplantación de identidad del vendedor:

```csharp
[HttpPost]
[Authorize]
[ProducesResponseType(typeof(SubastaResponse), StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaRequest request)
{
    var usuarioId = ObtenerUsuarioId();
    if (usuarioId is null)
    {
        return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });
    }

    request.VendedorId = usuarioId.Value;
    var resultado = await _subastaService.CrearSubastaAsync(request);
    return StatusCode(StatusCodes.Status201Created, resultado);
}
```

### 1.2. Exploración con Filtros y Paginación en Base de Datos

En `SubastaRepository.cs`, construimos la consulta dinámica con Entity Framework Core sin cargar datos innecesarios en memoria:

```csharp
public async Task<(List<Subasta> Items, int Total)> ObtenerSubastasAsync(...)
{
    var query = _context.Subastas
        .Include(s => s.Categoria)
        .Include(s => s.Vendedor)
        .Include(s => s.Pujas)
        .AsQueryable();

    if (estado.HasValue)
        query = query.Where(s => s.Estado == estado.Value);

    if (categoriaId.HasValue)
        query = query.Where(s => s.CategoriaId == categoriaId.Value);

    if (!string.IsNullOrWhiteSpace(busqueda))
        query = query.Where(s => s.Titulo.ToLower().Contains(busqueda.ToLower()));

    if (precioMin.HasValue)
        query = query.Where(s => s.PrecioBase >= precioMin.Value);

    if (precioMax.HasValue)
        query = query.Where(s => s.PrecioBase <= precioMax.Value);

    var total = await query.CountAsync();
    var items = await query
        .Skip((pagina - 1) * tamaño)
        .Take(tamaño)
        .ToListAsync();

    return (items, total);
}
```

### 1.3. Detalle de Lote con Identificación de Puja Líder

En `SubastaService.cs`, la ficha técnica calcula el precio actual de manera reactiva:

```csharp
var pujaLider = subasta.Pujas
    .OrderByDescending(p => p.Monto)
    .ThenByDescending(p => p.FechaPuja)
    .FirstOrDefault();

return new SubastaDetalleResponse
{
    Id = subasta.Id,
    Titulo = subasta.Titulo,
    Descripcion = subasta.Descripcion,
    UrlImagen = subasta.UrlImagen,
    PrecioBase = subasta.PrecioBase,
    IncrementoMinimo = subasta.IncrementoMinimo,
    MontoActual = pujaLider != null ? pujaLider.Monto : subasta.PrecioBase,
    TotalPujas = subasta.Pujas.Count,
    Estado = subasta.Estado.ToString(),
    Version = subasta.Version, // Token de concurrencia optimista
    FechaInicio = subasta.FechaInicio,
    FechaFin = subasta.FechaFin
};
```

---

## 2. Evidencia de Respuestas y Pruebas

### 2.1. Creación de Subasta Exitosa (201 Created)
Petición:
```http
POST /api/auctions
Authorization: Bearer <TOKEN_VENDEDOR>
Content-Type: application/json

{
  "titulo": "Monitor Gaming 144Hz 27 Pulgadas",
  "descripcion": "Panel IPS en perfecto estado",
  "urlImagen": "https://img.com/monitor.jpg",
  "precioBase": 80000,
  "incrementoMinimo": 2500,
  "fechaInicio": "2026-09-08T12:00:00Z",
  "fechaFin": "2026-09-15T18:00:00Z",
  "categoriaId": 1
}
```

Respuesta obtenida:
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 15,
  "titulo": "Monitor Gaming 144Hz 27 Pulgadas",
  "precioBase": 80000.00,
  "incrementoMinimo": 2500.00,
  "estado": "Programada",
  "version": 0,
  "vendedorId": 1,
  "categoriaId": 1
}
```

### 2.2. Rechazo por Regla de Fechas Invertidas (400 BadRequest)
Petición con `fechaFin` menor a `fechaInicio`:
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "mensaje": "La fecha de finalización debe ser posterior a la fecha de inicio."
}
```

### 2.3. Consulta del Catálogo Paginado (200 OK)
Petición `GET /api/auctions?pagina=1&tamaño=2&estado=Activa`:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "paginaActual": 1,
  "tamañoPagina": 2,
  "totalRegistros": 8,
  "totalPaginas": 4,
  "items": [
    {
      "id": 1,
      "titulo": "Subasta Activa - Finaliza en 2 minutos",
      "precioBase": 10000.00,
      "montoActual": 45000.00,
      "estado": "Activa"
    }
  ]
}
```
