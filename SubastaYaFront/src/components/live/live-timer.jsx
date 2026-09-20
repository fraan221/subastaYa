import { useCountdown } from '@/hooks/use-countdown'
import { Clock, AlertTriangle } from 'lucide-react'

/**
 * Componente de temporizador en vivo con cuenta regresiva en tiempo real.
 * Si el tiempo restante ingresa en la zona crítica (último minuto, <= 60s),
 * cambia dinámicamente de apariencia (fondo y borde rojo, animación pulsante y alerta)
 * para advertir a los postores.
 */
export function LiveTimer({ fechaFin, estado }) {
  const { days, hours, minutes, seconds, totalSeconds, isExpired } = useCountdown(fechaFin)

  if (estado === 'Finalizada' || estado === 'Desierta' || isExpired) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground font-semibold">
        <Clock className="size-5" />
        <span>Subasta {estado === 'Desierta' ? 'Desierta' : 'Finalizada'}</span>
      </div>
    )
  }

  const isCritical = totalSeconds <= 60 && totalSeconds > 0
  const isWarning = totalSeconds > 60 && totalSeconds <= 300
  const formatUnit = (val) => String(val).padStart(2, '0')

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
        isCritical
          ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400 animate-pulse shadow-sm'
          : isWarning
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          : 'bg-card border-border text-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <div className="p-2 rounded-lg bg-red-500/20 animate-bounce">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted">
            <Clock className="size-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <span className="text-xs uppercase font-bold tracking-wider block text-muted-foreground">
            {isCritical ? '¡Zona Crítica - Cierre Inminente!' : 'Tiempo Restante'}
          </span>
          <span className="text-2xl font-mono font-bold tracking-tight">
            {days > 0 && `${days}d `}
            {formatUnit(hours)}:{formatUnit(minutes)}:{formatUnit(seconds)}
          </span>
        </div>
      </div>

      {isCritical && (
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-600 text-white animate-pulse">
          Último Minuto
        </span>
      )}
    </div>
  )
}
