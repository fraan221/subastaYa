# Plan: Etiquetas One-Shot para Botones de Subasta

## [Goal Description]
Reemplazar los textos extensos de los botones en [`AuctionCard`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/auction-card.jsx) (*"Entrar a Sala en Vivo"* y *"Ver Sala de Subasta"*) por **términos de una sola palabra ("one-shot words")**, directos, contundentes y 100% alineados con la filosofía minimalista del proyecto.

---

## Opciones y Recomendación de Palabras One-Shot

### Opción A (Recomendada: Acción & Minimalismo Puro)
* **Subasta Activa:** **`Pujar`** (o acompañado del icono `<Radio className="size-4" />`)
  * *Por qué funciona:* Es la acción nuclear de cualquier plataforma de subastas. En un catálogo visual, el usuario no busca "entrar a una sala", busca **pujar**. Es conciso, crea urgencia y tiene peso de conversión inmediato.
* **Subasta No Activa (Pendiente / Finalizada / Pausada):** **`Ver`**
  * *Por qué funciona:* Cuando no se puede ofertar, el objetivo es puramente informativo. "Ver" es la palabra más corta, limpia y universal del diseño minimalista.

### Opción B (Enfoque de Navegación / Estado)
* **Subasta Activa:** **`Ingresar`** (o **`En Vivo`**)
* **Subasta No Activa:** **`Detalles`**
  * *Evaluación:* Más descriptivo sobre el destino, aunque un poco más formal y menos orientado a la acción inmediata.

### Opción C (Enfoque Transaccional)
* **Subasta Activa:** **`Ofertar`**
* **Subasta No Activa:** **`Consultar`**
  * *Evaluación:* Funciona bien en plataformas financieras, aunque "Ofertar" tiene una sílaba más que "Pujar" y "Consultar" suena más corporativo.

---

## User Review Required

> [!IMPORTANT]
> **Decisión requerida:**
> ¿Confirmas la **Opción A (`Pujar` / `Ver`)**, o prefieres alguna de las variantes (`Ingresar` / `Detalles`, `En Vivo` / `Ver`)?

---

## Proposed Changes

### Frontend - Componente de Tarjeta

#### [MODIFY] [`SubastaYaFront/src/components/auction-card.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/auction-card.jsx)

* Aplicar el texto de una sola palabra manteniendo el botón 100% clickeable con `buttonVariants`:

```diff
        {auction.estado === "Activa" ? (
          <Link
            to={`/subastas/${auction.id}/live`}
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs",
            )}
          >
            <Radio className="size-4" aria-hidden="true" />
-           Entrar a Sala en Vivo
+           Pujar
          </Link>
        ) : (
          <Link
            to={`/subastas/${auction.id}/live`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full font-medium flex items-center justify-center gap-2 cursor-pointer",
            )}
          >
-           Ver Sala de Subasta
+           Ver
          </Link>
        )}
```

---

## Verification Plan

### Automated Tests
* Ejecutar el linter para verificar sintaxis limpia:
  ```bash
  pnpm lint
  ```
* Ejecutar la compilación de Vite:
  ```bash
  pnpm build
  ```

### Manual Verification
* Abrir el catálogo (`/subastas` y `/subastas/en-vivo`):
  1. Verificar que las subastas activas muestren el botón con el indicador y la palabra única elegida (ej. `Pujar`).
  2. Verificar que las subastas finalizadas o en espera muestren el botón secundario simple (ej. `Ver`).
  3. Confirmar que la tarjeta mantenga un aspecto visual limpio, sobrio y sin sobrecarga de texto.
