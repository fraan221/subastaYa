import { Shield, Trophy, Clock } from "lucide-react";

export function BidHistory({ bids = [], currentUserId }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--:--";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <section
      aria-label="Historial de ofertas en vivo"
      className="flex flex-col rounded-xl border p-4 shadow-xs"
    >
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="font-semibold text-base">Historial</h3>
        <span className="text-xs text-muted-foreground font-medium">
          {bids.length} {bids.length === 1 ? "oferta" : "ofertas"}
        </span>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="flex items-center justify-center w-full"
      >
        {bids.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs flex flex-col items-center py-6">
            <div className="p-2 rounded-full bg-muted my-2">
              <Shield className="size-5 opacity-50" aria-hidden="true" />
            </div>
            <p className="font-medium text-foreground">
              Aún no hay ofertas registradas
            </p>
          </div>
        ) : (
          <ol className="w-full flex flex-col items-center justify-center space-y-2 mt-3">
            {bids.map((bid, index) => {
              const isMe = currentUserId && bid.compradorId === currentUserId;
              const isHighest = index === 0;

              return (
                <li
                  key={
                    bid.pujaId || `${bid.compradorId}-${bid.fechaPuja}-${index}`
                  }
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border ${
                    isHighest
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm">
                        {bid.compradorSeudonimo || `Postor #${bid.compradorId}`}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Tú
                        </span>
                      )}
                      {isHighest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                          Líder
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <time dateTime={bid.fechaPuja}>
                        {formatTime(bid.fechaPuja)}
                      </time>
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm tabular-nums ${
                        isHighest
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {formatCurrency(bid.monto)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
