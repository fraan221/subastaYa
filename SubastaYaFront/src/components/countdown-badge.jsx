import { useCountdown } from "@/hooks/use-countdown"
import { Badge } from "@/components/ui/badge"
import { ClockIcon, ClockAlertIcon, ClockCheck } from "lucide-react"

/**
 * Componente que muestra el contador regresivo de una subasta con retroalimentación visual:
 * - Si es Programada: Indica cuándo inicia
 * - Si es Activa > 5 min: Badge Outline / Normal
 * - Si es Activa entre 1 y 5 min: Badge amarillo (Atención)
 * - Si es Activa < 1 min: Badge rojo con pulso (Zona crítica anti-sniping)
 * - Si ya venció: Badge destructivo / Finalizado
 */
export function CountdownBadge({ fechaFin, fechaInicio, estado }) {
  const isProgramada = estado === "Programada"
  const targetDate = isProgramada ? fechaInicio : fechaFin
  const { days, hours, minutes, seconds, totalSeconds, isExpired } = useCountdown(targetDate)

  if (estado === "Desierta")
  {
    return (
      <>
        <Badge variant="destructive" className="text-xs">
          <ClockAlertIcon data-icon="inline-start" className="size-3.5" />
          Desierta
        </Badge>
      </>
    )
  }

  if (estado === "Finalizada" || (!isProgramada && isExpired)) {
    return (
      <Badge variant="secondary" className="text-xs">
        <ClockCheck data-icon="inline-start" className="size-3.5" />
        Finalizada
      </Badge>
    )
  }

  if (isProgramada) {
    if (isExpired) {
      return (
        <Badge variant="outline" className="border-blue-500/50 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
          <ClockIcon data-icon="inline-start" className="size-3.5" />
          Iniciando...
        </Badge>
      )
    }

    const formatted = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m ${seconds}s`
    return (
      <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-xs">
        <ClockIcon data-icon="inline-start" className="size-3.5" />
        Inicia en {formatted}
      </Badge>
    )
  }

  // Subasta Activa
  const formattedTime = days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Menor a 60 segundos: Zona crítica
  if (totalSeconds <= 60) {
    return (
      <Badge
        variant="destructive"
        className="font-mono text-xs animate-pulse font-semibold"
      >
        <ClockIcon data-icon="inline-start" className="size-3.5" />
        {formattedTime} (¡Último minuto!)
      </Badge>
    )
  }

  // Entre 1 y 5 minutos: Alerta moderada
  if (totalSeconds <= 300) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500 text-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-xs font-semibold"
      >
        <ClockIcon data-icon="inline-start" className="size-3.5" />
        {formattedTime}
      </Badge>
    )
  }

  // Normal > 5 minutos
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      <ClockIcon data-icon="inline-start" className="size-3.5" />
      {formattedTime}
    </Badge>
  )
}
