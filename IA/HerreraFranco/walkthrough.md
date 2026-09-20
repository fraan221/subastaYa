# Walkthrough: Refactorización de AuctionCard

## Resumen de Cambios

Se completó la refactorización de [`SubastaYaFront/src/components/auction-card.jsx`](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYaFront/src/components/auction-card.jsx) siguiendo el plan aprobado:

1. **Remoción de enlaces no deseados**:
   * Se eliminó el tag `<Link>` que envolvía a la imagen, colocándola dentro de un `<div className="overflow-hidden rounded-t-xl">` estático.
   * Se eliminó el tag `<Link>` y la clase `hover:underline` del título, dejándolo directamente como `<h3 className="font-semibold text-base">{auction.titulo}</h3>`.

2. **Resolución de zonas no clickeables en el botón CTA**:
   * Se eliminó el patrón `<Button asChild><Link>` que en `@base-ui` causaba zonas muertas debido a anidación de elementos interactivos.
   * Se pasó a un `<Link className={cn(buttonVariants(...), ...)}>` directo, asegurando que el 100% del área del botón (`w-full`) responda al click.
   * Se preservaron **los textos e iconos originales**:
     * Subasta Activa: `"Entrar a Sala en Vivo"` junto al icono `<Radio />`.
     * Otras: `"Ver Sala de Subasta"`.

---

## Verificación y Resultados

### Linter
```bash
pnpm lint
```
* **Resultado**: 0 errores.

### Build
```bash
pnpm build
```
* **Resultado**: Compilación Vite exitosa en 600ms sin advertencias de sintaxis o empaquetado.
