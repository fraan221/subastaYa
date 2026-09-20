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

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 ${
        isAntiSniping
          ? 'bg-amber-500/95 text-white border-amber-600'
          : isSuccess
          ? 'bg-emerald-600/95 text-white border-emerald-700'
          : isOutbid
          ? 'bg-red-600/95 text-white border-red-700'
          : 'bg-card text-foreground border-border'
      }`}
    >
      {isAntiSniping && <Flame className="size-5 shrink-0 animate-bounce" />}
      {isSuccess && <CheckCircle2 className="size-5 shrink-0" />}
      {isOutbid && <Clock className="size-5 shrink-0 animate-pulse" />}
      {!isAntiSniping && !isSuccess && !isOutbid && <AlertCircle className="size-5 shrink-0" />}

      <div className="flex-1 text-xs leading-snug">
        <span className="font-bold block uppercase tracking-wide text-[10px] opacity-85 mb-0.5">
          {isAntiSniping
            ? 'Regla Anti-Sniping'
            : isOutbid
            ? '¡Has Sido Superado!'
            : isSuccess
            ? 'Puja Confirmada'
            : 'Aviso'}
        </span>
        {alert.message}
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        className="text-white/80 hover:text-white shrink-0 p-0.5 rounded cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/**
 * Componente que renderiza notificaciones visuales reactivas (toasts flotantes)
 * ante eventos clave de la sala:
 * - Confirmación de puja exitosa.
 * - Alerta inmediata de "Superado (Outbid)".
 * - Aviso de extensión de tiempo por regla Anti-Sniping.
 * - Mensajes de rechazo o fondos insuficientes.
 */
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {visibleAlerts.map((alert) => (
        <ToastItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
