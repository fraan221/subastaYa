import { useCountdown } from '@/hooks/use-countdown'
import { Clock, AlertTriangle, CheckCircle, Ban } from 'lucide-react'

export function LiveTimer({ fechaFin, estado }) {
  const { days, hours, minutes, seconds, totalSeconds, isExpired } = useCountdown(fechaFin)

  if (estado === 'Finalizada' || isExpired) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border text-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider block text-muted-foreground">
              Estado
            </span>
            <span className="text-base font-bold">Subasta Finalizada</span>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border text-muted-foreground">
          Cerrada
        </span>
      </div>
    )
  }

  if (estado === 'Desierta') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border text-muted-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Ban className="size-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider block">
              Estado
            </span>
            <span className="text-base font-bold">Subasta Desierta</span>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border">
          Sin ofertas
        </span>
      </div>
    )
  }

  const isCritical = totalSeconds <= 60 && totalSeconds > 0
  const isWarning = totalSeconds > 60 && totalSeconds <= 300
  const formatUnit = (val) => String(val).padStart(2, '0')

  return (
    <div
      role="region"
      aria-label="Temporizador de subasta en tiempo real"
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors duration-300 ${
        isCritical
          ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
          : isWarning
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          : 'bg-card border-border text-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <div className="p-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <Clock className="size-5" aria-hidden="true" />
          </div>
        )}
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider block text-muted-foreground">
            {isCritical ? '¡Cierre Inminente!' : 'Tiempo Restante'}
          </span>
          <span className="text-2xl font-mono font-bold tracking-tight tabular-nums">
            {days > 0 && `${days}d `}
            {formatUnit(hours)}:{formatUnit(minutes)}:{formatUnit(seconds)}
          </span>
        </div>
      </div>

      {isCritical && (
        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white">
          Último Minuto
        </span>
      )}
    </div>
  )
}
