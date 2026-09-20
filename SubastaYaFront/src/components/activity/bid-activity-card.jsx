import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownBadge } from "@/components/countdown-badge";
import { TagIcon, TrophyIcon } from "lucide-react";

const fallbackImage =
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80";

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "Sin ofertas";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getResultClass(resultado) {
  switch (resultado) {
    case "Ganaste":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "Perdiste":
      return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case "Desierta":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    default:
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }
}

export function BidActivityCard({ activity }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Card>
      <img
        src={
          imageFailed || !activity.urlImagen
            ? fallbackImage
            : activity.urlImagen
        }
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

        <Badge variant="outline" className={getResultClass(activity.resultado)}>
          {activity.resultado === "Ganaste" ? (
            <TrophyIcon data-icon="inline-start" />
          ) : null}
          {activity.resultado}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">
              Mi puja máxima
            </span>
            <p className="text-lg font-bold">
              {formatCurrency(activity.miPujaMaxima)}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">Oferta actual</span>
            <p className="text-lg font-bold">
              {formatCurrency(activity.montoActual)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{activity.cantidadPujas} pujas</span>
          <span>Finalizó el {formatDate(activity.fechaFin)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
