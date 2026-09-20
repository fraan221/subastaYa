# Guía de Puesta en Marcha y Verificación de Concurrencia

**Autor:** Catriel Aliaga  
**Proyecto:** SubastaYa  

---

## 1. Prerrequisitos del Entorno

- **.NET SDK:** Versión 10.0 o superior.
- **Node.js:** Versión 20 o superior y gestor `pnpm`.
- **Docker y Docker Compose:** Para el servicio de base de datos PostgreSQL.

---

## 2. Puesta en Marcha Paso a Paso

### Paso 1: Base de Datos en Docker
Desde la raíz del repositorio (`/subastaYa/`):
```bash
docker compose up -d db
```
Verificar que el contenedor se encuentre activo y saludable:
```bash
docker compose ps
# Salida esperada: subastaya-db-1 ... (healthy) en 0.0.0.0:5432->5432/tcp
```

### Paso 2: Backend ASP.NET Core Web API
En una terminal:
```bash
cd SubastaYa/
dotnet run
```
- La API aplicará automáticamente las migraciones pendientes (`db.Database.Migrate()`).
- Se ejecutará el seeder con datos de prueba (`DbSeeder.SeederAsync(db)`).
- La API quedará escuchando en `http://localhost:5080`.
- Swagger UI disponible en `http://localhost:5080/swagger`.

### Paso 3: Frontend React + Vite
En otra terminal:
```bash
cd SubastaYaFront/
pnpm install
pnpm dev
```
- El servidor de desarrollo iniciará en `http://localhost:5173`.

---

## 3. Verificación de la Prueba de Estrés de Concurrencia Optimista

Para demostrar el funcionamiento del control de concurrencia optimista exigido por la cátedra (dos ofertas simultáneas sobre la misma subasta donde una resulta aceptada y la otra rechazada con HTTP 409):

Con el backend en ejecución, abrir una terminal en la raíz y ejecutar:
```bash
node StressTest/run_concurrency.js
```

### Salida Esperada:
```text
[Stress Test] Subasta 1 (v0) - Disparando 2 peticiones concurrentes por $50000...
  -> Petición 1: HTTP 409 - Rechazada (Conflicto de concurrencia: otro usuario modificó los datos simultáneamente. Por favor, intentá nuevamente.)
  -> Petición 2: HTTP 201 - Aceptada (Puja ID: 4, Monto: $50000)
[Consistencia] Versión: 0 -> 1 | Monto líder: $50000 (Comprador2)
[Resultado] OK: Concurrencia Optimista Verificada (201 vs 409)
```

---

## 4. Usuarios Preconfigurados para Demostración Manual

| Usuario | Correo Electrónico | Contraseña | Saldo Inicial | Rol en Demostración |
|---|---|---|---|---|
| **Vendedor** | `vendedor@test.com` | `password12345` | $0 | Propietario de los lotes publicados. |
| **Comprador 1** | `comprador1@test.com` | `password12345` | $105.000 disponible | Postor en pestaña normal. |
| **Comprador 2** | `comprador2@test.com` | `password12345` | $145.000 disponible | Postor en ventana de incógnito para generar sobrepujas y eventos *Outbid*. |
| **Sin Fondos** | `sinfondos@test.com` | `password12345` | $500 disponible | Para verificar rechazo por saldo insuficiente. |
