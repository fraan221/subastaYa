import { useState } from 'react'
import { useBidding } from '@/hooks/use-bidding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, AlertCircle, CheckCircle2, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Consola interactiva para el envío dinámico de ofertas en la sala en vivo.
 * Ofrece un botón de oferta rápida calculada automáticamente (Puja actual + incremento mínimo),
 * un campo de monto personalizado superior y muestra el estado competitivo en tiempo real.
 */
export function BiddingConsole({ auction, currentUser, bids, latestBid, onBidSuccess }) {
  const bidsOrLatest = bids && bids.length > 0 ? bids : latestBid
  const {
    balance,
    suggestedBid,
    userStatus,
    customAmount,
    setCustomAmount,
    submitBid,
    submitting,
    error,
  } = useBidding(auction, currentUser, bidsOrLatest, onBidSuccess)

  const [localError, setLocalError] = useState(null)

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val)

  const isSeller = currentUser?.id && auction?.vendedorId && currentUser.id === auction.vendedorId
  const isLeading = userStatus === 'leading'
  const isFinished = auction?.estado === 'Finalizada' || auction?.estado === 'Desierta'

  const handleQuickBid = async () => {
    setLocalError(null)
    try {
      await submitBid(suggestedBid)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const handleCustomBid = async (e) => {
    e.preventDefault()
    setLocalError(null)
    const val = Number(customAmount)

    if (!val || val < suggestedBid) {
      setLocalError(`El monto debe ser como mínimo la sugerencia: ${formatCurrency(suggestedBid)}`)
      return
    }

    try {
      await submitBid(val)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Consola de Puja Dinámica
        </h3>

        {/* Indicador visual inmediato de estado */}
        {isFinished ? (
          latestBid?.compradorId === currentUser?.id ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="size-3.5" />
              ¡Ganaste esta subasta!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted font-medium">
              Subasta Finalizada
            </span>
          )
        ) : isLeading ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
            <CheckCircle2 className="size-3.5" />
            Liderando la subasta
          </span>
        ) : userStatus === 'outbid' ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-bounce">
            <AlertCircle className="size-3.5" />
            ¡Has sido superado! (Outbid)
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted">
            Modo Espectador
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
        <span>
          Incremento Mínimo: <strong>{formatCurrency(auction?.incrementoMinimo || 0)}</strong>
        </span>
        <span className="flex items-center gap-1">
          <Wallet className="size-3.5" />
          Saldo Disponible: <strong>{balance !== null ? formatCurrency(balance) : 'Cargando...'}</strong>
        </span>
      </div>

      {/* Sugerencia Automática y Botón Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={handleQuickBid}
          disabled={submitting || isLeading || isSeller || isFinished}
          className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          <Zap className="size-5" />
          Pujar {formatCurrency(suggestedBid)}
        </Button>

        {/* Monto Personalizado Superior */}
        <form onSubmit={handleCustomBid} className="flex gap-2">
          <Input
            type="number"
            placeholder={`Mayor a ${formatCurrency(suggestedBid)}`}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            disabled={submitting || isSeller || isFinished}
            min={suggestedBid}
            className="h-12"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={submitting || isSeller || isFinished || !customAmount}
            className="h-12 px-4 font-semibold cursor-pointer disabled:cursor-not-allowed"
          >
            Ofertar
          </Button>
        </form>
      </div>

      {/* Mensajes de validación / error / fondos insuficientes */}
      {(localError || error) && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{localError || error}</span>
          </div>
          {(localError || error)?.includes('Saldo') && (
            <Link to="/billetera/cargar" className="underline font-bold shrink-0 hover:text-red-700">
              Cargar saldo
            </Link>
          )}
        </div>
      )}

      {isSeller && (
        <p className="text-xs text-muted-foreground italic text-center">
          Eres el vendedor de este lote; no puedes ofertar en tu propia subasta.
        </p>
      )}
    </div>
  )
}
