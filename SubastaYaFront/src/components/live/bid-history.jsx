import { Shield, Trophy, Clock } from 'lucide-react'

/**
 * Componente que muestra el historial cronológico de ofertas de la subasta en vivo.
 * Muestra el monto formateado en moneda local, el seudónimo anonimizado del comprador
 * y la marca de tiempo exacta de cada postura.
 */
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
    <div className="flex flex-col h-full bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          Historial de Ofertas en Vivo
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {bids.length} {bids.length === 1 ? 'oferta' : 'ofertas'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 space-y-2 max-h-[420px] pr-1">
        {bids.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Shield className="size-8 mx-auto mb-2 opacity-40" />
            No hay ofertas registradas aún. ¡Sé el primero en pujar!
          </div>
        ) : (
          bids.map((bid, index) => {
            const isMe = currentUserId && bid.compradorId === currentUserId
            const isHighest = index === 0

            return (
              <div
                key={bid.pujaId || `${bid.compradorId}-${bid.fechaPuja}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isHighest
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-xs'
                    : 'bg-muted/40 border-border/50'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {bid.compradorSeudonimo || `Postor #${bid.compradorId}`}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        Tú
                      </span>
                    )}
                    {isHighest && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                        Líder
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="size-3" />
                    {formatTime(bid.fechaPuja)}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-base ${
                      isHighest
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(bid.monto)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
