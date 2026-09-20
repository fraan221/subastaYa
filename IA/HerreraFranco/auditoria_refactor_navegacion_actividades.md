# Auditoría y Refactorización: Navegación, Mis Actividades y Merge de API Documentation

**Sesión:** SubastaYa - Franco Herrera  
**Rama:** `dev`  
**Fecha:** 19 de Septiembre de 2026  
**Autor:** Franco Herrera  

---

## 1. Resumen de la Sesión

En esta sesión se realizaron tres intervenciones clave sobre el frontend y la integración de ramas del proyecto:
1. **Reordenamiento de Navegación del Sidebar:** Modificación de prioridades para posicionar la sección **Billetera** antes de **Actividades**, manteniendo **Subastas** en la cabecera.
2. **Rediseño Copywriting One-Shot:** Estandarización de las etiquetas de navegación y cabeceras a un estilo minimalista, directo y autodescriptivo ("One-Word / Acción pura") eliminando ambigüedades e inconsistencias sintácticas.
3. **Auditoría y Refactorización de `MisActividadesPage` (WCAG 2.2 + Frontend Design):** Reestructuración del componente bajo el patrón de configuración desacoplada (*Strategy Pattern*), eliminando más de 6 operadores ternarios, removiendo títulos redundantes y corrigiendo contrastes de color en modo oscuro.
4. **Merge de `feature/api-documentation` a `dev`:** Comprobación de integridad, resolución de integración sin conflictos en `Program.cs` y consolidación en la rama principal de desarrollo.

---

## 2. Reordenamiento y Rediseño de Navegación One-Shot

### 2.1 Diagnóstico Previo
* **Inconsistencia Sintáctica:** Convivían verbos en infinitivo (*Publicar*, *Cargar*), sustantivos genéricos (*Catálogo*, *Balance*, *Movimientos*) y frases posesivas en primera persona con barras divisorias (*Mis Compras / Pujas*, *Mis Publicaciones*).
* **Ruido Cognitivo:** El uso de barras (`/`) generaba fricción de lectura en interfaces de escaneo rápido.
* **Placeholder Heredado:** Se mantenía el texto `"Enterprise"` en la cabecera del sidebar, residuo de plantillas base de shadcn/ui.
* **Desalineación con Breadcrumbs:** Los títulos de navegación no guardaban correspondencia exacta con las rutas mapeadas en `App.jsx`.

### 2.2 Tabla Comparativa de Términos (Opción 2 Implementada)

| Contexto / Ruta | Etiqueta Original | Etiqueta One-Shot | Justificación Técnica / UX |
| :--- | :--- | :--- | :--- |
| **Sidebar Header** | `Enterprise` | **`Portal`** | Reemplaza placeholder estático de shadcn. |
| **Sección 1** | `Subastas` | **`Subastas`** | Módulo raíz del catálogo. |
| `/subastas` | `Catálogo` | **`Explorar`** | Llamado a la acción directo para descubrir artículos. |
| `/subastas/crear` | `Publicar` | **`Subastar`** | Verbo específico alineado al dominio de negocio. |
| `/subastas/en-vivo` | `Sala en Vivo` | **`En Vivo`** | Conciso, claro y adaptable a badges dinámicos. |
| **Sección 2 (Reordenada)** | `Billetera` | **`Billetera`** | Posicionada antes de Actividad. |
| `/billetera` | `Balance` | **`Saldo`** | Término estándar para fondos disponibles. |
| `/billetera/cargar` | `Cargar` | **`Recargar`** | Elimina ambigüedad con subida de archivos o documentos. |
| `/billetera/movimientos` | `Movimientos` | **`Historial`** | Autoexplicativo y unificado. |
| **Sección 3** | `Mis Actividades` | **`Actividad`** | Sustantivo sobrio, elimina posesivo redundante. |
| `/mis-actividades/compras` | `Mis Compras / Pujas` | **`Pujas`** | Elimina la barra `/` y el texto sobrecargado. |
| `/mis-actividades/publicaciones` | `Mis Publicaciones` | **`Ventas`** | Representa el rol vendedor del postor de manera unívoca. |

### 2.3 Archivos Modificados
* [`SubastaYaFront/src/components/app-sidebar.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/app-sidebar.jsx): Reordenamiento del array `navItems`, actualización de títulos y cambio de subtítulo a `Portal`.
* [`SubastaYaFront/src/App.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/App.jsx): Sincronización del diccionario `headerTitles` y mapeo de sección activa en breadcrumbs (`AppHeader`).

---

## 3. Auditoría y Refactorización de `MisActividadesPage`

### 3.1 Hallazgos de Auditoría

#### A. Jerarquía y Redundancia Visual
`MisActividadesPage` renderizaba un encabezado `<h1>` con un párrafo descriptivo (`<p>`). Dado que `AppHeader` (componente superior pegajoso) ya incluye breadcrumbs dinámicos con el contexto (`Actividad > Pujas`), este bloque duplicaba información y rompía la consistencia visual con `CatalogPage`, `WalletBalancePage` y `WalletTransactionsPage`.

#### B. Sobrecarga de Lógica Condicional (Code Smell)
El componente acumulaba ternarios en cascada:
* `const isBidsView = type === "bids";`
* 4 variables de texto dependientes de `isBidsView` (`title`, `description`, `emptyTitle`, `emptyDescription`).
* Ternario en la llamada asíncrona de datos (`getMyBids` vs `getMyListings`).
* Ternario en el renderizado de tarjetas (`<BidActivityCard />` vs `<PublicationActivityCard />`).

#### C. Inconsistencia en Skeletons
`ActivitySkeleton` implementaba clases ad-hoc (`rounded-4xl`, `rounded-3xl`, `shadow-md`), discrepando de los estándares de tarjeta de shadcn y del catálogo (`rounded-xl border border-border p-4 bg-card`).

#### D. Accesibilidad (WCAG 2.2) y Modo Oscuro
* **Alertas sin Live Region:** El contenedor de error no tenía `role="alert"`.
* **Botones sin Accessible Name:** Los botones de paginación carecían de atributos descriptivos (`aria-label="Página anterior"` / `aria-label="Página siguiente"`).
* **Contraste de Badges en Modo Oscuro:** En `bid-activity-card.jsx` y `publication-activity-card.jsx`, clases como `bg-emerald-50/60 text-emerald-700` provocaban bajo contraste en fondos oscuros. Se migraron a la paleta semántica con soporte dual (`bg-*-500/10 text-*-600 dark:text-*-400 border border-*-500/20`), coincidiendo con `WalletTransactionsPage`.

### 3.2 Implementación del Patrón de Configuración (*Strategy Pattern*)

Se desacopló la lógica de presentación y obtención de datos en una estructura externa al componente:

```javascript
const CONFIG = {
  bids: {
    fetcher: (params) => activityService.getMyBids(params),
    Card: BidActivityCard,
    errorTitle: "Pujas",
    emptyTitle: "Sin pujas registradas",
    emptyDescription: "Las subastas en las que ofertes aparecerán aquí.",
  },
  listings: {
    fetcher: (params) => activityService.getMyListings(params),
    Card: PublicationActivityCard,
    errorTitle: "Ventas",
    emptyTitle: "Sin publicaciones",
    emptyDescription: "Las subastas que publiques aparecerán aquí.",
  },
};
```

**Beneficios obtenidos:**
* **Cero operadores ternarios** dentro de la función del componente y en el retorno JSX.
* Adición del hook de limpieza de paginación: `useEffect(() => { setPagina(1); }, [type]);` para evitar que un número de página alto persista al cambiar de tab.
* Inclusión de `role="alert"`, `aria-hidden="true"` en iconos auxiliares y `aria-label` en controles de paginación.

---

## 4. Commits y Merge Realizados

### Commit 1: Refactorización de Navegación y Actividades
* **Hash:** `721ad28564b67012805eb987436d1c3cc494186d`
* **Mensaje:** `refactor: streamline navigation order, labels, and activities page architecture`
* **Archivos impactados:**
  * `SubastaYaFront/src/App.jsx`
  * `SubastaYaFront/src/components/app-sidebar.jsx`
  * `SubastaYaFront/src/pages/MisActividadesPage.jsx`
  * `SubastaYaFront/src/components/activity/bid-activity-card.jsx`
  * `SubastaYaFront/src/components/activity/publication-activity-card.jsx`

### Commit 2: Merge de Integración de Documentación y Pruebas
* **Hash:** `8a2558004f1a4e1d13db523c97db3786196230b0`
* **Mensaje:** `merge: combine api-documentation into dev`
* **Ramas fusionadas:** `feature/api-documentation` $\rightarrow$ `dev`
* **Estado:** Auto-merge limpio sin conflictos en `SubastaYa/Program.cs`.
* **Componentes incorporados al backend:**
  * Documentación interactiva OpenAPI (`/openapi/v1.json`) y Swagger UI (`/swagger`) con autenticación Bearer JWT.
  * Suite de pruebas de estrés y concurrencia en [`StressTest/`](file:///home/fraan/Documents/Projects/SubastaYa/StressTest) utilizando Newman y colecciones de Postman.
  * Documentación general en [`README.md`](file:///home/fraan/Documents/Projects/SubastaYa/README.md).
