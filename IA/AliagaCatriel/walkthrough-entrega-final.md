# Walkthrough de Cierre y Entrega Final — SubastaYa

**Autor:** Catriel Aliaga  
**Rama:** `dev`  
**Estado:** Sincronizado en `origin/dev`  

---

## 1. Resumen de las Últimas Refactorizaciones

Previo a la entrega formal del proyecto, se aplicaron dos mejoras de calidad y consistencia en el backend y el entorno de pruebas:

### 1.1. Inicialización de Colecciones en `Subasta.cs`
- **Archivo:** `SubastaYa/Models/Entities/Subasta.cs`
- **Cambio:** Se reemplazó la asignación nula `public ICollection<Puja> Pujas { get; set; } = null!;` por `public ICollection<Puja> Pujas { get; set; } = new List<Puja>();`.
- **Razón:** Previene excepciones `NullReferenceException` al instanciar entidades en memoria fuera de EF Core.

### 1.2. Mapeo de Clave Foránea en `AppDbContext.cs`
- **Archivo:** `SubastaYa/Data/AppDbContext.cs`
- **Cambio:** Se removió `.IsRequired(false)` en la relación `entity.HasOne(tl => tl.Billetera)...`.
- **Razón:** La columna `billetera_id` es un `int` primitivo obligatorio en la base de datos; la configuración previa introducía una contradicción en el modelo de Fluent API.

### 1.3. Fijación de Dependencias del Runner de Estrés
- **Archivo:** `StressTest/package-lock.json`
- **Cambio:** Se incorporó el archivo de bloqueo de dependencias de npm al control de versiones.
- **Razón:** Asegura que cualquier persona o entorno que ejecute `node StressTest/run_concurrency.js` utilice exactamente las mismas versiones de Newman y sus sub-dependencias.

---

## 2. Historial de Commits Relacionados

```bash
53d21b3 chore(test): track package lock for deterministic stress test dependencies
b198c50 refactor(backend): initialize auction collections and enforce strict wallet relationship mapping
94beb88 fix(frontend): prevent duplicate outbid alerts and update documentation artifacts
9e32413 merge: combine live-auction-room into dev
a7e34d2 fix(backend): resolve anti-sniping query, anonymous catalog access, and signalr privacy
635a4b0 fix(frontend): resolve wallet balance loading, auction states, and card navigation
a8f7c00 style(ui/ux): eliminate distracting animations for a calm minimalist interface
4d77bc7 feat(ui/ux): elevate live auction room and catalog with minimalist WCAG AA patterns
ef1d3f8 feat: implement live auction room with real-time SignalR bidding
```

---

## 3. Certificación de Estado del Repositorio

- **Compilación de Backend:** `dotnet build` finaliza con 0 errores y 0 advertencias.
- **Compilación de Frontend:** `pnpm build` compila limpiamente sin fallos en React 19 / Vite.
- **Base de Datos:** PostgreSQL 16 operativa bajo Docker Compose con migraciones automáticas y seed data en runtime.
- **Prueba de Concurrencia:** Verificada y reproducible con salida esperada `201 vs 409`.
- **Árbol de Git:** `nothing to commit, working tree clean` en la rama `dev`.
