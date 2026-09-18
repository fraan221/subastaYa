import { useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountdownBadge } from "@/components/countdown-badge"
import { TagIcon, LayersIcon } from "lucide-react"

/**
 * Tarjeta de producto para el catálogo de subastas.
 * Muestra imagen con fallback, título, categoría, oferta máxima actual,
 * cantidad de pujas registradas y cuenta regresiva dinámica.
 */
export function AuctionCard({ auction }) {
  const [imageFailed, setImageFailed] = useState(false)

  const estadoBadgeVariant = {
    Activa: "outline",
    Programada: "secondary",
    Finalizada: "secondary",
    Desierta: "destructive",
  }[auction.estado] || "outline"

  const fallbackImage = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80"
  const currentPrice = auction.montoActual ?? auction.precioBase
  const formattedPrice = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(currentPrice)

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/40 group">
      {/* Contenedor de Imagen */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={imageFailed || !auction.urlImagen ? fallbackImage : auction.urlImagen}
          alt={auction.titulo}
          onError={() => setImageFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge variant={estadoBadgeVariant} className="backdrop-blur-md bg-background/85 text-xs font-medium shadow-xs">
            {auction.estado}
          </Badge>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <CountdownBadge
            fechaFin={auction.fechaFin}
            fechaInicio={auction.fechaInicio}
            estado={auction.estado}
          />
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <TagIcon className="size-3.5" />
          <span>{auction.categoriaNombre}</span>
        </div>
        <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {auction.titulo}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-1 flex-1">
        <div className="flex flex-col gap-0.5 mt-2">
          <span className="text-xs text-muted-foreground font-medium">
            {auction.cantidadPujas > 0 ? "Oferta más alta:" : "Precio base inicial:"}
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            {formattedPrice}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground mt-auto">
        <div className="flex items-center gap-1.5 pt-3">
          <LayersIcon className="size-3.5" />
          <span>
            {auction.cantidadPujas} {auction.cantidadPujas === 1 ? "oferta" : "ofertas"}
          </span>
        </div>
        <span className="pt-3 font-medium text-primary text-xs group-hover:underline">
          Ver detalles →
        </span>
      </CardFooter>
    </Card>
  )
}
