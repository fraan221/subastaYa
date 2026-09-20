# Walkthrough — Módulo 1: Catálogo y Exploración de Subastas

Se ha completado la implementación completa del **Módulo 1: Catálogo y Exploración de Subastas** tanto en Backend como en Frontend, cumpliendo estrictamente con los requerimientos de la cátedra y aplicando las guías de buenas prácticas.

---

## 1. Cambios en el Backend (.NET 10)

### Optimización y Filtros en `AuctionsController` & Repositorio
1. **Filtro por Rango de Precios:**
   - Agregados parámetros `precioMin` y `precioMax` con validación defensiva en [AuctionsController.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Controllers/AuctionsController.cs):
     - `precioMin >= 0`
     - `precioMax >= 0`
     - `precioMin <= precioMax` (retorna `400 Bad Request` si no es consistente).
2. **Filtro por Ordenamiento:**
   - Parámetro `ordenamiento` (`tiempo` para menor tiempo restante, `mayor_puja` para mayor oferta/precio base, o `recientes` por defecto).
3. **Optimización con `AsNoTracking`:**
   - En [SubastaRepository.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Repositories/SubastaRepository.cs), se añadió `.AsNoTracking()` para optimizar el rendimiento y el consumo de memoria en consultas de solo lectura.
4. **DTO `SubastaListadoResponse`:**
   - Añadida la propiedad `FechaInicio` en [SubastaListadoResponse.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Models/Dtos/Responses/SubastaListadoResponse.cs) para sincronizar cuentas regresivas de subastas programadas.
5. **Fotos reales de Unsplash en `DbSeeder`:**
   - Se actualizaron las 5 subastas de prueba en [DbSeeder.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Data/DbSeeder.cs) con imágenes reales en alta resolución de Unsplash correspondientes a cada categoría (notebook gamer, figura coleccionable, campera de cuero, bicicleta y teclado mecánico).

---

## 2. Cambios en el Frontend (React 19 + Vite + Shadcn)

### Enrutamiento y Navegación
1. **`react-router-dom` Instalado:**
   - Enrutador SPA configurado en [App.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/App.jsx) con ruta `/subastas`.
   - Se removió la tarjeta de diagnóstico del sistema para que el usuario autenticado acceda directamente al catálogo.
2. **Sidebar con Submenú Jerárquico Colapsable:**
   - En [app-sidebar.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/app-sidebar.jsx) y [nav-main.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/nav-main.jsx), se configuró el submenú de **Subastas**:
     - *Explorar Catálogo* (Activo, navega a `/subastas`).
     - *Publicar Subasta* (Con indicador "Próx.", reservado para Módulo 2).
     - *Sala en Vivo* (Con indicador "Próx.", reservado para Módulo 3).

### Capa de Servicios y Hooks
1. **`auctionService.js`:**
   - [auctionService.js](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/services/auctionService.js): Métodos `getAuctions(...)`, `getAuctionById(id)` y `getCategories()`.
2. **`useCountdown.js`:**
   - [use-countdown.js](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/hooks/use-countdown.js): Hook reactivo para cuentas regresivas precisas por segundo con limpieza de intervalos contra fugas de memoria.

### Componentes de UI
1. **`CountdownBadge.jsx`:**
   - [countdown-badge.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/countdown-badge.jsx): Indicador de tiempo con semáforo visual:
     - Badge azul para subastas programadas ("Inicia en X").
     - Badge gris para subastas finalizadas o desiertas.
     - Badge ámbar para subastas entre 1 y 5 minutos.
     - Badge rojo pulsante para zona crítica (< 60 segundos, anti-sniping).
2. **`AuctionCard.jsx`:**
   - [auction-card.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/auction-card.jsx): Tarjeta compuesta con imagen Unsplash, fallback automático ante errores de red, badges de categoría y estado, oferta máxima actual / precio base en formato ARS y cantidad de pujas.
3. **`CatalogPage.jsx`:**
   - [CatalogPage.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/CatalogPage.jsx): Vista principal del catálogo con barra de búsqueda reactiva, selectores de estado (Todos, Activas, Próximas, Finalizadas, Desiertas), categorías dinámicas, filtros por rango de precios numéricos, ordenamiento, skeleton loaders y paginación.
4. **Shadcn `Select`:**
   - Agregado el componente primitivo [select.jsx](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/ui/select.jsx).

---

## 3. Verificación y Calidad

- **Build Backend (.NET 10):**
  ```bash
  dotnet build SubastaYa/SubastaYa.csproj
  # Build succeeded. 0 Warning(s), 0 Error(s).
  ```
- **Lint Frontend (ESLint):**
  ```bash
  pnpm lint
  # 0 errors
  ```
- **Build Frontend (Vite):**
  ```bash
  pnpm build
  # ✓ built in 565ms
  ```
