import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { CountdownBadge } from "@/components/countdown-badge"
import { TagIcon, Radio } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function AuctionCard({ auction }) {
  const [imageFailed, setImageFailed] = useState(false)
  const fallbackImage = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80"
  const currentPrice = auction.montoActual ?? auction.precioBase
  const formattedPrice = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(currentPrice)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link to={`/subastas/${auction.id}/live`} className="block overflow-hidden rounded-t-xl">
        <img
          src={imageFailed || !auction.urlImagen ? fallbackImage : auction.urlImagen}
          alt={auction.titulo}
          onError={() => setImageFailed(true)}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      </Link>

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
        <Link to={`/subastas/${auction.id}/live`} className="hover:underline">
          <h3 className="font-semibold text-base">
            {auction.titulo}
          </h3>
        </Link>
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
          <Button
            asChild
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Link to={`/subastas/${auction.id}/live`}>
              <Radio className="size-4" aria-hidden="true" />
              Entrar a Sala en Vivo
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="w-full font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            <Link to={`/subastas/${auction.id}/live`}>
              Ver Sala de Subasta
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
