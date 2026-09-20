# Walkthrough: Prueba de Concurrencia Optimista (Stress Test) en Postman

Se ha creado e integrado en el repositorio la solución de **Stress Test en Postman** para dar cumplimiento estricto a la Sección 4.1 de las pautas de entrega de la cátedra de Proyecto de Software.

---

## 1. Colección Exportable de Postman

📁 **Archivo:** [`StressTest/SubastaYa_Stress_Test.postman_collection.json`](file:///home/fraan/Documents/Projects/SubastaYa/StressTest/SubastaYa_Stress_Test.postman_collection.json)

La colección sigue el estándar oficial **Schema v2.1.0** e incluye:
* **Variables de colección predefinidas:**
  * `baseUrl`: `http://localhost:5080`
  * `subastaId`: `1` (Subasta estándar sembrada inicialmente)
  * `compradorId`: `3` (Usuario habilitado con saldo disponible de $145.000)
  * `monto`: `50000` (Monto superador a los $45.000 de la puja previa)
* **3 Peticiones estructuradas:**
  1. `1. Consultar Estado Previo de Subasta`: Validación inicial de subasta activa y versión `0`.
  2. `2. Stress Test - 2 Pujas Simultaneas (201 vs 409)`:
     * **Pre-request Script:** Dispara dos peticiones HTTP idénticas en paralelo al mismo milisegundo utilizando `Promise.all([requestA, requestB])`.
     * **Tests Script:** Aserciones automáticas en `pm.test` comprobando `[201, 409]` y la presencia del mensaje de error por concurrencia.
     * **Visualizer:** Renderiza una tabla comparativa en la pestaña *Visualize* con badges verde (`201 Created`) y rojo (`409 Conflict`).
  3. `3. Verificar Estado Posterior de Subasta`: Comprueba que la versión se haya incrementado y que la nueva puja líder esté registrada.

---

## 2. Documentación en el Repositorio

📁 **Archivo:** [`README.md`](file:///home/fraan/Documents/Projects/SubastaYa/README.md)

Se actualizó la sección `## Control de Concurrencia y Stress Test`:
* Explicación del mecanismo de control de concurrencia optimista (*Optimistic Concurrency Control*) con `[ConcurrencyCheck] public int Version`.
* **Procedimiento para resetear la BD a su estado semilla inicial:**
  ```bash
  docker compose down -v && docker compose up -d db
  dotnet run --project SubastaYa/SubastaYa.csproj
  ```
* Instrucciones para importar y ejecutar la colección en Postman.
* Bloque de código con el script de concurrencia en JavaScript.
* Detalle de las validaciones automáticas y la visualización de resultados.

---

## 3. Estado de Git

```bash
$ git status
On branch feature/api-documentation
Changes not staged for commit:
	modified:   README.md

Untracked files:
	StressTest/
```
