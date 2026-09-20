# Plan de Refactorización de AuctionCard

## Diagnóstico y Respuesta a Dudas

### 1. ¿El código de este componente es uno solo o está duplicado?
**Es uno solo.** No existe duplicación en el proyecto:
* Componente único: [`SubastaYaFront/src/components/auction-card.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/auction-card.jsx).
* Uso único: Es importado y consumido exclusivamente en [`SubastaYaFront/src/pages/CatalogPage.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/pages/CatalogPage.jsx#L340).
* Vistas: Tanto `/subastas` como `/subastas/en-vivo` montan `CatalogPage`, por lo que ambas consumen este mismo componente.

> [!NOTE]
> **¿Por qué no respondió tu cambio manual?**
> En el turno anterior, al solicitar volver al estado anterior, se ejecutó un `git checkout HEAD` que restauró el archivo al commit `a8f7c00`. En ese commit original todavía existían los tags `<Link>` envolviendo la imagen (línea 24) y el título (línea 46). Cualquier edición manual no guardada o en buffer fue sobreescrita por esa restauración de git.

---

## [Goal Description]
1. **Eliminar los enlaces `<Link>` de la imagen y del título**:
   * La imagen quedará en un contenedor estático `<div>` sin interacción de navegación.
   * El título `<h3>` quedará como texto estático sin link ni subrayado.
2. **Resolver el problema de zonas muertas (dead zones) en el botón CTA**:
   * Actualmente se usa `<Button asChild><Link ...></Button>`. Dado que `@base-ui` no implementa `asChild` como Radix, renderiza un `<button>` de ancho completo que envuelve internamente a una etiqueta `<a>` pequeña, haciendo que hacer clic en los bordes del botón no navegue.
   * La solución consiste en usar directamente `<Link className={cn(buttonVariants(...), ...)}>` conservando **exactamente los mismos textos originales**, iconos y colores, logrando que el 100% del área del botón sea clickeable y semánticamente válida (`<a>` sin `<button>` padre).

---

## User Review Required
> [!IMPORTANT]
> Al remover los links de la imagen y el título, **el único elemento interactivo que navegará a la sala en vivo será el botón inferior** ("Entrar a Sala en Vivo" o "Ver Sala de Subasta").

---

## Open Questions
No hay dudas bloqueantes identificadas. Se respetará la distribución, textos y clases originales.

---

## Proposed Changes

### Frontend - Componentes de Catálogo

#### [MODIFY] [`SubastaYaFront/src/components/auction-card.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/auction-card.jsx)

* **Imagen**: Reemplazar `<Link ... className="block overflow-hidden rounded-t-xl"><img ... /></Link>` por `<div className="overflow-hidden rounded-t-xl"><img ... /></div>`.
* **Título**: Reemplazar `<Link ... className="hover:underline"><h3 ...>{auction.titulo}</h3></Link>` directamente por `<h3 className="font-semibold text-base">{auction.titulo}</h3>`.
* **Botón Activa**: Reemplazar la anidación `<Button asChild ...><Link to=...><Radio /> Entrar a Sala en Vivo</Link></Button>` por `<Link to=... className={cn(buttonVariants({ variant: "default" }), "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs")}><Radio className="size-4" aria-hidden="true" />Entrar a Sala en Vivo</Link>`.
* **Botón Inactiva/Finalizada**: Reemplazar la anidación `<Button asChild variant="outline" ...><Link to=...>Ver Sala de Subasta</Link></Button>` por `<Link to=... className={cn(buttonVariants({ variant: "outline" }), "w-full font-medium flex items-center justify-center gap-2 cursor-pointer")}>Ver Sala de Subasta</Link>`.

```diff
-     <Link to={`/subastas/${auction.id}/live`} className="block overflow-hidden rounded-t-xl">
+     <div className="overflow-hidden rounded-t-xl">
        <img
          src={imageFailed || !auction.urlImagen ? fallbackImage : auction.urlImagen}
          alt={auction.titulo}
          onError={() => setImageFailed(true)}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
-     </Link>
+     </div>

      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-row gap-1 text-xs text-muted-foreground">
            <TagIcon className="size-3.5" />
            <span>{auction.categoriaNombre}</span>
          </div>
          <CountdownBadge 
            fechaFin={auction.fechaFin}
            fechaInicio={auction.fechaInicio}
            estado={auction.estado}
          />
        </div>
-       <Link to={`/subastas/${auction.id}/live`} className="hover:underline">
          <h3 className="font-semibold text-base">
            {auction.titulo}
          </h3>
-       </Link>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">
            {auction.cantidadPujas > 0 ? "Oferta más alta:" : "Precio base inicial:"}
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            {formattedPrice}
          </span>
        </div>

        {auction.estado === "Activa" ? (
-         <Button
-           asChild
-           className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
-         >
-           <Link to={`/subastas/${auction.id}/live`}>
-             <Radio className="size-4" aria-hidden="true" />
-             Entrar a Sala en Vivo
-           </Link>
-         </Button>
+         <Link
+           to={`/subastas/${auction.id}/live`}
+           className={cn(
+             buttonVariants({ variant: "default" }),
+             "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
+           )}
+         >
+           <Radio className="size-4" aria-hidden="true" />
+           Entrar a Sala en Vivo
+         </Link>
        ) : (
-         <Button
-           asChild
-           variant="outline"
-           className="w-full font-medium flex items-center justify-center gap-2 cursor-pointer"
-         >
-           <Link to={`/subastas/${auction.id}/live`}>
-             Ver Sala de Subasta
-           </Link>
-         </Button>
+         <Link
+           to={`/subastas/${auction.id}/live`}
+           className={cn(
+             buttonVariants({ variant: "outline" }),
+             "w-full font-medium flex items-center justify-center gap-2 cursor-pointer"
+           )}
+         >
+           Ver Sala de Subasta
+         </Link>
        )}
      </CardContent>
```

---

## Verification Plan

### Automated Tests
* Ejecutar linter del frontend:
  ```bash
  pnpm lint
  ```
* Ejecutar build de Vite:
  ```bash
  pnpm build
  ```

### Manual Verification
* Navegar a `/subastas`:
  1. Verificar que al pasar el cursor sobre la imagen o el título no se muestre cursor pointer ni enlace de navegación.
  2. Verificar que al hacer clic en cualquier parte del botón inferior ("Entrar a Sala en Vivo" o "Ver Sala de Subasta"), incluso en los bordes y padding lateral, la navegación a `/subastas/:id/live` funcione de forma inmediata sin zonas muertas.
