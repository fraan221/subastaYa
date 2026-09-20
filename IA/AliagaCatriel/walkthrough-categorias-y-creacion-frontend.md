# Walkthrough: API de Categorías e Integración de Alta de Subastas en Frontend

**Autor:** Catriel Aliaga  
**Commits Documentados:**
- `034b4d6`: *feat: add categories endpoint*
- `28fc646`: *feat: integrate auction creation with catalog*  
**Estado:** ✅ Implementado, verificado e integrado end-to-end con la interfaz web.

---

## 1. Implementación Técnica Realizada

### 1.1. Endpoint de Categorías en Backend (`CategoriesController.cs`)
Implementado con soporte de cancelación asíncrona:

```csharp
[HttpGet]
[AllowAnonymous]
[ProducesResponseType(typeof(IReadOnlyList<CategoriaResponse>), StatusCodes.Status200OK)]
public async Task<ActionResult<IReadOnlyList<CategoriaResponse>>> Listar(
    CancellationToken cancellationToken)
{
    var categorias = await _categoriaService.ListarAsync(cancellationToken);
    return Ok(categorias);
}
```

### 1.2. Consumo en React (`categoryService.js`)
Cliente HTTP que interactúa con la API de ASP.NET Core:

```javascript
import { apiClient } from './apiClient';

export const categoryService = {
  async getCategories() {
    const response = await apiClient.get('/api/categories');
    return response.data;
  }
};
```

### 1.3. Integración en el Formulario de Alta
El componente realiza la carga dinámica de categorías al montar y formatea las fechas en UTC para prevenir desfasajes:

```jsx
useEffect(() => {
  async function cargarCategorias() {
    try {
      const data = await categoryService.getCategories();
      setCategorias(data);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  }
  cargarCategorias();
}, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const payload = {
      ...form,
      fechaInicio: new Date(form.fechaInicio).toISOString(),
      fechaFin: new Date(form.fechaFin).toISOString()
    };
    await auctionService.createAuction(payload);
    toast.success("Subasta creada con éxito");
    navigate("/catalogo");
  } catch (err) {
    toast.error(err.response?.data?.mensaje || "Error al publicar la subasta");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 2. Pruebas y Evidencia Funcional

### 2.1. Verificación del Endpoint de Categorías (200 OK)
Petición `GET /api/categories`:
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  { "id": 1, "nombre": "Electrónica", "urlIcono": "https://img.com/icons/electronics.svg" },
  { "id": 2, "nombre": "Vehículos", "urlIcono": "https://img.com/icons/vehicles.svg" },
  { "id": 3, "nombre": "Coleccionables", "urlIcono": "https://img.com/icons/collectibles.svg" }
]
```

### 2.2. Flujo Completo en el Navegador
1. El usuario navega a la pantalla de publicación.
2. El menú desplegable de categoría se rellena de forma transparente con los datos obtenidos de la base de datos PostgreSQL.
3. Se ingresa un lote de prueba con imagen y fechas válidas.
4. Al hacer clic en "Publicar Lote", el botón entra en estado deshabilitado con spinner, la API responde con `201 Created` y la aplicación redirige de inmediato al catálogo donde se visualiza la nueva tarjeta de subasta.
