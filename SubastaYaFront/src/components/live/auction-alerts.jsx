import { useState, useCallback, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Flame, Clock, X } from 'lucide-react'

function ToastItem({ alert, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(alert.id)
    }, 5500)
    return () => clearTimeout(timer)
  }, [alert.id, onDismiss])

  const isAntiSniping = alert.type === 'antisniping'
  const isSuccess = alert.type === 'success'
  const isOutbid = alert.type === 'outbid'
  const isRejected = alert.type === 'rejected'

  // Contraste sobrio y minimalista WCAG AA (>= 4.5:1)
  const styles = isAntiSniping
    ? 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700'
    : isSuccess
    ? 'bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-900 dark:border-emerald-700'
    : isOutbid || isRejected
    ? 'bg-red-700 text-white border-red-800 dark:bg-red-950 dark:text-red-100 dark:border-red-800'
    : 'bg-card text-card-foreground border-border'

  const role = isOutbid || isRejected ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-atomic="true"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-md border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 motion-reduce:animate-none ${styles}`}
    >
      {isAntiSniping && <Flame className="size-4.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
      {isSuccess && <CheckCircle2 className="size-4.5 shrink-0 text-emerald-200" aria-hidden="true" />}
      {(isOutbid || isRejected) && <Clock className="size-4.5 shrink-0 text-red-200" aria-hidden="true" />}
      {!isAntiSniping && !isSuccess && !isOutbid && !isRejected && <AlertCircle className="size-4.5 shrink-0" aria-hidden="true" />}

      <div className="flex-1 text-xs leading-snug">
        <span className="font-semibold block uppercase tracking-wide text-[10px] opacity-85 mb-0.5">
          {isAntiSniping
            ? 'Anti-Sniping (+2 min)'
            : isOutbid
            ? 'Superado en la puja'
            : isSuccess
            ? 'Puja confirmada'
            : isRejected
            ? 'Oferta rechazada'
            : 'Aviso'}
        </span>
        {alert.message}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 flex items-center justify-center min-w-[32px] min-h-[32px] -mr-1 -mt-1 p-1 rounded-md opacity-75 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function AuctionAlerts({ alerts = [] }) {
  const [dismissedIds, setDismissedIds] = useState(() => new Set())

  const handleDismiss = useCallback((id) => {
    setDismissedIds((prev) => {
      const updated = new Set(prev)
      updated.add(id)
      return updated
    })
  }, [])

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id))

  if (visibleAlerts.length === 0) return null

  return (
    <aside
      aria-label="Notificaciones de subasta en vivo"
      aria-live="polite"
      aria-relevant="additions text"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {visibleAlerts.map((alert) => (
        <ToastItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}
    </aside>
  )
}
