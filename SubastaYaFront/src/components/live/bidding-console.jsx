import { useState } from "react";
import { useBidding } from "@/hooks/use-bidding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Link } from "react-router-dom";

export function BiddingConsole({
  auction,
  currentUser,
  bids,
  latestBid,
  onBidSuccess,
}) {
  const bidsOrLatest = bids && bids.length > 0 ? bids : latestBid;
  const {
    balance,
    loadingBalance,
    suggestedBid,
    userStatus,
    customAmount,
    setCustomAmount,
    submitBid,
    submitting,
    error,
  } = useBidding(auction, currentUser, bidsOrLatest, onBidSuccess);

  const [localError, setLocalError] = useState(null);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);

  const isSeller =
    currentUser?.id &&
    auction?.vendedorId &&
    currentUser.id === auction.vendedorId;
  const isLeading = userStatus === "leading";
  const isExpired = Boolean(
    auction?.fechaFin && new Date(auction.fechaFin) <= new Date(),
  );
  const isClosed =
    auction?.estado === "Finalizada" ||
    auction?.estado === "Desierta" ||
    isExpired;
  const hasBids = Boolean(
    latestBid ||
    (bids && bids.length > 0) ||
    (auction?.cantidadPujas && auction.cantidadPujas > 0),
  );
  const isDeserted = auction?.estado === "Desierta" || (isClosed && !hasBids);
  const hasInsufficientBalance =
    !loadingBalance && balance !== null && balance < suggestedBid;

  const handleQuickBid = async () => {
    setLocalError(null);
    try {
      await submitBid(suggestedBid);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleQuickIncrement = (delta) => {
    setLocalError(null);
    const base =
      Number(customAmount) > suggestedBid ? Number(customAmount) : suggestedBid;
    setCustomAmount(String(base + delta));
  };

  const handleCustomBid = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const val = Number(customAmount);

    if (!val || val < suggestedBid) {
      setLocalError(
        `El monto debe ser como mínimo: ${formatCurrency(suggestedBid)}`,
      );
      return;
    }

    try {
      await submitBid(val);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  if (isSeller) {
    return (
      <div className="bg-card rounded-xl border p-4 space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ShieldCheck className="size-4.5" />
          <span>Modo Vendedor (Monitor en vivo)</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Estás supervisando tu subasta. Por políticas de integridad de la
          plataforma, el titular del lote no puede realizar ofertas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4.5 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-base flex items-center gap-2">
          Consola de Puja
        </h3>

        {isDeserted ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
            <Ban className="size-3.5" aria-hidden="true" />
            Subasta Desierta
          </span>
        ) : isClosed ? (
          latestBid?.compradorId === currentUser?.id ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              ¡Ganaste esta subasta!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted font-medium">
              Subasta Finalizada
            </span>
          )
        ) : isLeading ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Liderando la subasta
          </span>
        ) : userStatus === "outbid" ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            Superado por otro postor
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted font-medium">
            Modo Espectador
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
        <span>
          Incremento Mínimo:{" "}
          <strong className="text-foreground font-semibold">
            {formatCurrency(auction?.incrementoMinimo || 0)}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          Saldo:{" "}
          <strong
            className={
              hasInsufficientBalance
                ? "text-red-600 dark:text-red-400 font-semibold"
                : "text-foreground font-semibold"
            }
          >
            {loadingBalance
              ? "Cargando..."
              : balance !== null
                ? formatCurrency(balance)
                : "No disponible"}
          </strong>
        </span>
      </div>

      {hasInsufficientBalance && !isClosed && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <span>Saldo insuficiente para la siguiente puja sugerida.</span>
          <Link
            to="/billetera/cargar"
            className="font-semibold underline ml-2 shrink-0 hover:text-amber-950 dark:hover:text-amber-100"
          >
            Cargar Saldo
          </Link>
        </div>
      )}

      {/* Sugerencia Automática y Botón Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Button
          type="button"
          onClick={handleQuickBid}
          disabled={
            submitting ||
            isLeading ||
            isClosed ||
            hasInsufficientBalance ||
            loadingBalance
          }
          className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          aria-label={`Pujar rápidamente ${formatCurrency(suggestedBid)}`}
        >
          Pujar {formatCurrency(suggestedBid)}
        </Button>

        {/* Monto Personalizado Superior */}
        <form onSubmit={handleCustomBid} className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="custom-bid-amount" className="sr-only">
              Monto de puja personalizada
            </label>
            <Input
              id="custom-bid-amount"
              type="number"
              placeholder={`Mayor a ${formatCurrency(suggestedBid)}`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              disabled={submitting || isClosed || loadingBalance}
              min={suggestedBid}
              className="h-11 text-sm tabular-nums"
              aria-describedby={
                localError || error ? "bid-error-msg" : undefined
              }
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={
              submitting || isClosed || !customAmount || loadingBalance
            }
            className="h-11 px-3.5 text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
            aria-label="Confirmar oferta con monto personalizado"
          >
            Ofertar
          </Button>
        </form>
      </div>

      {/* Presets de incremento rápido compatibles con billetera */}
      {!isClosed && (
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Incrementar:</span>
          {[1000, 5000, 10000, 50000].map((step) => (
            <Button
              key={step}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickIncrement(step)}
              disabled={isClosed || loadingBalance}
              className="h-7 px-2 text-xs font-normal"
            >
              +{formatCurrency(step)}
            </Button>
          ))}
        </div>
      )}

      {/* Errores */}
      {(localError || error) && (
        <div
          id="bid-error-msg"
          role="alert"
          aria-live="assertive"
          className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>{localError || error}</span>
          </div>
          {(localError || error)?.includes("Saldo") && (
            <Link
              to="/billetera/cargar"
              className="underline font-bold shrink-0 hover:text-red-900"
            >
              Cargar saldo
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
