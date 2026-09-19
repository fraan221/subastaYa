import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CountdownBadge } from "@/components/countdown-badge"
import { TagIcon, TrophyIcon } from "lucide-react"

const fallbackImage =
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80"

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function formatDate(value) {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusClass(status) {
  switch (status) {
    case "Adjudicada":
      return "border-emerald-500/50 bg-emerald-50/60 text-emerald-700"
    case "Desierta":
      return "border-destructive/50 text-destructive"
    default:
      return "border-blue-500/50 bg-blue-50/60 text-blue-700"
  }
}

export function PublicationActivityCard({ activity }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <Card>
      <img
        src={imageFailed || !activity.urlImagen ? fallbackImage : activity.urlImagen}
        alt={activity.titulo}
        onError={() => setImageFailed(true)}
        loading="lazy"
        className="aspect-video w-full rounded-t-4xl object-cover"
      />

      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TagIcon className="size-3.5" />
            <span>{activity.categoriaNombre}</span>
          </div>

          <CountdownBadge
            fechaInicio={activity.fechaInicio}
            fechaFin={activity.fechaFin}
            estado={activity.estado}
          />
        </div>

        <h3 className="font-semibold text-base">{activity.titulo}</h3>

        <Badge
          variant="outline"
          className={getStatusClass(activity.estadoAdjudicacion)}
        >
          {activity.estadoAdjudicacion === "Adjudicada" ? (
            <TrophyIcon data-icon="inline-start" />
          ) : null}
          {activity.estadoAdjudicacion}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">
              Oferta actual
            </span>
            <p className="text-lg font-bold">
              {formatCurrency(activity.montoActual)}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              Recaudación
            </span>
            <p className="text-lg font-bold">
              {formatCurrency(activity.recaudacion)}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cantidad de pujas</span>
            <span className="font-medium">{activity.cantidadPujas}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Ganador</span>
            <span className="font-medium">
              {activity.ganadorNombre || "Pendiente"}
            </span>
          </div>

          <p className="pt-1 text-xs text-muted-foreground">
            Finaliza {formatDate(activity.fechaFin)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
