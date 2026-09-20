import { Shield, Trophy, Clock } from 'lucide-react'

export function BidHistory({ bids = [], currentUserId }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val)

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--:--'
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <section
      aria-label="Historial de ofertas en vivo"
      className="flex flex-col h-full bg-card rounded-xl border p-4 shadow-xs"
    >
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" aria-hidden="true" />
          Historial de Ofertas
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {bids.length} {bids.length === 1 ? 'oferta' : 'ofertas'}
        </span>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex-1 overflow-y-auto mt-3 space-y-2 max-h-[460px] pr-1"
      >
        {bids.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs flex flex-col items-center">
            <div className="p-2.5 rounded-full bg-muted mb-2">
              <Shield className="size-5 opacity-50" aria-hidden="true" />
            </div>
            <p className="font-medium text-foreground">Aún no hay ofertas registradas</p>
            <p className="text-muted-foreground mt-0.5">Sé el primero en posicionarte como líder.</p>
          </div>
        ) : (
          <ol className="space-y-2 list-none p-0 m-0">
            {bids.map((bid, index) => {
              const isMe = currentUserId && bid.compradorId === currentUserId
              const isHighest = index === 0

              return (
                <li
                  key={bid.pujaId || `${bid.compradorId}-${bid.fechaPuja}-${index}`}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none ${
                    isHighest
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs">
                        {bid.compradorSeudonimo || `Postor #${bid.compradorId}`}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-primary/20 text-primary">
                          Tú
                        </span>
                      )}
                      {isHighest && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-600 text-white">
                          Líder
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" aria-hidden="true" />
                      <time dateTime={bid.fechaPuja}>{formatTime(bid.fechaPuja)}</time>
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm tabular-nums ${
                        isHighest
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                      }`}
                    >
                      {formatCurrency(bid.monto)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
