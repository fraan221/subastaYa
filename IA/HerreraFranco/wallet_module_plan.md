# Plan de Implementación: Módulo 4 - Billetera Virtual y Gestión de Fondos

## Descripción del Objetivo
Implementar el **Módulo 4: Billetera Virtual y Gestión de Fondos** de SubastaYa tanto en el backend (.NET 10 Web API) como en el frontend (React + Tailwind CSS + Base UI), siguiendo la arquitectura y estilo de diseño ya establecidos en el módulo de Subastas:
- Navegación segmentada en sub-menús con **breadcrumbs dinámicos**.
- UI minimalista y de alta precisión con **palabras *one-shot*** (una palabra por módulo / acción).
- Reducción del 95% de textos superfluos de IA: únicamente inputs limpios, etiquetas concisas y retroalimentación mediante **Toasts** y **Spinners**.
- Visualización de las 3 métricas financieras críticas: **Saldo Total**, **Saldo Retenido (Garantía/Escrow)** y **Saldo Disponible**.
- Formulario de **Carga de Saldo Simulada** con feedback de carga y actualización inmediata.
- Tabla de **Historial de Movimientos** (*Ledger*) con trazabilidad de depósitos, retenciones, liberaciones y débitos/créditos de subastas ganadas.

---

## Rama de Trabajo Propuesta
Basada en la rama `dev`:
```bash
git checkout dev
git pull origin dev
git checkout -b feature/wallet-management
```
**Nombre de rama**: `feature/wallet-management`

---

## Decisiones de Diseño Confirmadas por el Usuario

> [!IMPORTANT]
> **Estructura de Sub-menús y Breadcrumbs One-Shot**:
> 1. `/billetera` ➔ Breadcrumb: **Billetera > Balance** (Métricas de Saldo Total, Retenido y Disponible).
> 2. `/billetera/cargar` ➔ Breadcrumb: **Billetera > Cargar** (Formulario minimalista de depósito ficticio).
> 3. `/billetera/movimientos` ➔ Breadcrumb: **Billetera > Movimientos** (Tabla de transacciones históricas / Ledger).

> [!NOTE]
> **Vista de Balance Pura**:
> Rechazada la inclusión de botones de acceso rápido redundantes en la vista de Balance. La vista se concentrará exclusivamente en la visualización clara y elegante de las 3 métricas financieras (Total, Retenido, Disponible). La navegación entre secciones se realiza de forma limpia y exclusiva desde el menú lateral y los breadcrumbs.

> [!NOTE]
> **Data Fetching y Estado (Sin TanStack Query)**:
> Se mantiene el patrón nativo actual del proyecto (`useState`, `useEffect` con limpieza de suscripción/cancelación, y `services/` con `apiClient`). Esto evita complejidad accidental, dependencias innecesarias y código ajeno que deba justificarse en la defensa oral del trabajo práctico.

---

## Arquitectura y Flujo de Datos

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React)"]
        Sidebar["Sidebar ('Billetera')"]
        Breadcrumbs["Breadcrumbs ('Billetera > [Sección]')"]
        BalancePage["/billetera ('Balance')<br/>3 Métricas Financieras"]
        DepositPage["/billetera/cargar ('Cargar')<br/>Formulario Minimalista + Spinners"]
        LedgerPage["/billetera/movimientos ('Movimientos')<br/>Tabla Ledger + Badges"]
        WalletService["walletService.js"]
    end

    subgraph Backend ["Backend (.NET Web API)"]
        WalletController["WalletController.cs<br/>/api/wallet"]
        BilleteraService["BilleteraService.cs"]
        BilleteraRepo["BilleteraRepository.cs"]
        Db["PostgreSQL / EF Core<br/>(Billeteras, TransaccionLedger, Auditoria)"]
    end

    Sidebar --> BalancePage & DepositPage & LedgerPage
    BalancePage --> Breadcrumbs
    DepositPage --> Breadcrumbs
    LedgerPage --> Breadcrumbs

    BalancePage --> WalletService
    DepositPage --> WalletService
    LedgerPage --> WalletService

    WalletService -->|GET /api/wallet/balance?usuarioId={id}| WalletController
    WalletService -->|POST /api/wallet/deposit| WalletController
    WalletService -->|GET /api/wallet/transactions?usuarioId={id}| WalletController

    WalletController --> BilleteraService
    BilleteraService --> BilleteraRepo
    BilleteraRepo --> Db
```

---

## Cambios Propuestos

### Backend (SubastaYa)

El backend ya cuenta con `Billetera` y `TransaccionLedger` mapeados en EF Core, y endpoints para `GET /api/wallet/balance` y `POST /api/wallet/deposit`. Se añadirán los métodos y DTOs para obtener el balance individual del usuario autenticado y el listado de transacciones históricas.

---

#### [NEW] [TransaccionResponse.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Models/Dtos/Responses/TransaccionResponse.cs)
DTO de respuesta para los movimientos del libro mayor:
```csharp
namespace SubastaYa.Models.Dtos.Responses;

public class TransaccionResponse
{
    public int Id { get; set; }
    public int BilleteraId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public int? SubastaId { get; set; }
    public string? SubastaTitulo { get; set; }
}
```

---

#### [MODIFY] [IBilleteraRepository.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Repositories/Interfaces/IBilleteraRepository.cs)
Añadir consulta de transacciones por usuario o billetera:
```csharp
Task<List<TransaccionLedger>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId);
```

---

#### [MODIFY] [BilleteraRepository.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Repositories/BilleteraRepository.cs)
Implementar la consulta incluyendo la navegación a `Subasta` para obtener el título referencial:
```csharp
public async Task<List<TransaccionLedger>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId)
{
    return await _context.TransaccionLedgers
        .Include(t => t.Subasta)
        .Where(t => t.Billetera.UsuarioId == usuarioId)
        .OrderByDescending(t => t.Fecha)
        .ToListAsync();
}
```

---

#### [MODIFY] [IBilleteraService.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Services/Interfaces/IBilleteraService.cs)
Añadir métodos para balance de usuario específico y consulta de transacciones:
```csharp
Task<BalanceResponse> ObtenerBalancePorUsuarioIdAsync(int usuarioId);
Task<List<TransaccionResponse>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId);
```

---

#### [MODIFY] [BilleteraService.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Services/BilleteraService.cs)
Implementar `ObtenerBalancePorUsuarioIdAsync` y `ObtenerTransaccionesPorUsuarioIdAsync` mapeando los enums de `TipoTransaccion` y datos de subasta asociada.

---

#### [MODIFY] [WalletController.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Controllers/WalletController.cs)
- `GET /api/wallet/balance`: Admitir parámetro opcional `[FromQuery] int? usuarioId`. Si viene especificado o si existe un usuario autenticado vía JWT, devolver el `BalanceResponse` correspondiente; si no se provee parámetro, mantener retorno de la lista completa (retrocompatibilidad).
- `GET /api/wallet/transactions`: Nuevo endpoint RESTful que recibe `[FromQuery] int usuarioId` (o claim JWT) y retorna `List<TransaccionResponse>`.

---

### Frontend (SubastaYaFront)

#### [NEW] [walletService.js](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/services/walletService.js)
Servicio para consumir la API de billetera:
```javascript
import apiClient from './apiClient';

export const walletService = {
  async getBalance(usuarioId) {
    const response = await apiClient.get('/wallet/balance', {
      params: { usuarioId },
    });
    return response.data;
  },

  async deposit(payload) {
    const response = await apiClient.post('/wallet/deposit', payload);
    return response.data;
  },

  async getTransactions(usuarioId) {
    const response = await apiClient.get('/wallet/transactions', {
      params: { usuarioId },
    });
    return response.data;
  },
};
```

---

#### [NEW] [WalletBalancePage.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/WalletBalancePage.jsx)
Vista principal `/billetera` ("Balance"):
- Grid de 3 tarjetas métricas con diseño moderno y minimalista:
  1. **Total**: Saldo acumulado en la cuenta.
  2. **Retenido**: Saldo en garantía (pujas líderes activas).
  3. **Disponible**: Saldo líquido para nuevas operaciones.
- Enfoque puro en métricas financieras (sin botones redundantes; navegación mediante sidebar/breadcrumbs).
- Soporte para skeletons durante la carga y feedback de error limpio con reintento.

---

#### [NEW] [WalletDepositPage.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/WalletDepositPage.jsx)
Vista `/billetera/cargar` ("Cargar"):
- Formulario ultra-minimalista: campo numérico "Monto" con adorno `$` mediante `InputGroup`.
- Botones rápidos de monto predeterminado (`+$10.000`, `+$50.000`, `+$100.000`) para agilizar pruebas.
- Botón de submit "Cargar" con `<Spinner />` en estado pendiente.
- Toast feedback:
  - Éxito: "Saldo acreditado"
  - Advertencia/Error: Mensajes concisos de validación o error de red.
- Cero explicaciones redundantes de IA: únicamente inputs y feedback visual reactivo.

---

#### [NEW] [WalletTransactionsPage.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/WalletTransactionsPage.jsx)
Vista `/billetera/movimientos` ("Movimientos"):
- Tabla elegante con columnas: `Tipo`, `Monto`, `Fecha`, `Referencia`.
- Badges estilizados según `Tipo`:
  - `Deposito` (verde / default)
  - `Retencion` (ámbar / alerta)
  - `Liberacion` (azul / informativo)
  - `Pago` (rojo / débito)
  - `Cobro` (verde / crédito)
- Estado vacío minimalista ("Sin movimientos") si no existen transacciones.
- Skeleton loader durante la obtención de datos.

---

#### [MODIFY] [app-sidebar.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/app-sidebar.jsx)
Agregar la sección **Billetera** al `navItems` con icono `WalletIcon`:
```javascript
{
  title: "Billetera",
  url: "/billetera",
  icon: <WalletIcon />,
  isActive: true,
  items: [
    { title: "Balance", url: "/billetera" },
    { title: "Cargar", url: "/billetera/cargar" },
    { title: "Movimientos", url: "/billetera/movimientos" },
  ],
}
```

---

#### [MODIFY] [App.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/App.jsx)
- Actualizar `AppHeader` para que el breadcrumb padre sea dinámico:
  - Si la ruta empieza con `/subastas`, el padre es **Subastas**.
  - Si la ruta empieza con `/billetera`, el padre es **Billetera**.
- Agregar mapeo de títulos en `headerTitles`:
  - `"/billetera": "Balance"`
  - `"/billetera/cargar": "Cargar"`
  - `"/billetera/movimientos": "Movimientos"`
- Registrar las rutas en `<Routes>`:
  - `<Route path="/billetera" element={<WalletBalancePage user={user} />} />`
  - `<Route path="/billetera/cargar" element={<WalletDepositPage user={user} />} />`
  - `<Route path="/billetera/movimientos" element={<WalletTransactionsPage user={user} />} />`

---

## Validación con Skills de Backend y Frontend

### Backend (`aspnet-core`, `dotnet-best-practices`, `csharp-async`)
- **Separación de Responsabilidades y Clean Architecture**:
  - `WalletController`: Solo maneja códigos de estado HTTP (200, 400, 404, 409), lectura de claims/parámetros y DTOs.
  - `BilleteraService`: Aplica reglas de negocio y orquesta transacciones y logs de auditoría.
  - `BilleteraRepository`: Aislamiento estricto de consultas EF Core (`AsNoTracking` donde aplique, `Include(t => t.Subasta)`).
- **Asincronismo Puro**: Todos los métodos de E/S devuelven `Task` o `Task<T>`, utilizando `await` con consultas EF Core asíncronas (`ToListAsync`, `FirstOrDefaultAsync`).
- **RESTful Estricto y OpenAPI**: Rutas basadas en sustantivos plurales (`/api/wallet/transactions`), tipos de retorno explícitos con `[ProducesResponseType]`.
- **Manejo de Errores Específico**: Excepciones de dominio tipadas (`NotFoundException`, `BusinessRuleException`, `ConcurrencyConflictException`) capturadas y transformadas en respuestas HTTP adecuadas (evitando errores genéricos 500).

### Frontend (`react-best-practices`, `composition-patterns`, `frontend-design`, `accessibility`)
- **Ciclo de Vida Limpio y Sin Waterfalls**: Efectos con banderas de desmontaje (`ignore = true` / `isMounted`) para prevenir race conditions y actualizaciones en componentes desmontados.
- **Sin Prop Proliferation**: Composición modular de componentes basada en la librería existente (Base UI / Tailwind CSS), reutilizando `InputGroup`, `Spinner`, `Toast`, `Badge`, `Card`.
- **Renderizado Condicional Seguro**: Ternarios sobre `&&` para evitar renderizar valores falsy (`0`) en la interfaz.
- **Accesibilidad (a11y)**: Etiquetas `aria-invalid`, atributos `role="alert"`, contraste de colores accesible según WCAG 2.2 y navegación por teclado nativa.
- **UI Minimalista One-Shot**: Cero textos inflados de IA. Máxima concisión visual y funcional.

---

## Plan de Verificación

### Pruebas Automatizadas
1. **Compilación y Build de Backend**:
   ```bash
   dotnet build SubastaYa/SubastaYa.csproj
   ```
2. **Linter y Build de Frontend**:
   ```bash
   cd SubastaYaFront && pnpm run lint && pnpm run build
   ```

### Verificación Manual
1. **Creación de Rama y Navegación**:
   - Confirmar checkout a `feature/wallet-management`.
   - Verificar la presencia de la sección "Billetera" en el sidebar desplegable con sus 3 sub-menús: *Balance*, *Cargar*, *Movimientos*.
   - Comprobar que los breadcrumbs muestran con exactitud `Billetera > Balance`, `Billetera > Cargar` y `Billetera > Movimientos`.
2. **Visualización de Métricas (Balance)**:
   - Iniciar sesión con `comprador1@test.com`.
   - Verificar que se muestren los valores sembrados: Saldo Total ($150.000), Saldo Retenido ($45.000) y Saldo Disponible ($105.000).
3. **Carga de Saldo (Cargar)**:
   - Ingresar un monto (ej. $50.000) o hacer clic en un preset.
   - Presionar "Cargar": observar el Spinner en el botón durante la petición.
   - Validar la aparición del Toast de confirmación ("Saldo acreditado").
   - Verificar que al volver a *Balance*, el Saldo Total y Disponible se hayan incrementado en $50.000.
4. **Historial de Movimientos (Movimientos)**:
   - Verificar que la tabla liste el depósito recién acreditado y los movimientos previos (depósitos iniciales, retenciones, liberaciones).
   - Comprobar los badges visuales diferenciados por tipo.
