import { useState, useEffect, useMemo, useCallback } from "react";
import { bidService } from "@/services/bidService";

/**
 * Hook para gestionar la lógica de oferta de una subasta en vivo:
 * - Cálculo de la sugerencia automática (Puja actual + Incremento mínimo).
 * - Estado competitivo del usuario (Liderando / Superado / Modo Espectador).
 * - Validación financiera frente al saldo disponible de billetera.
 */
export function useBidding(auction, currentUser, latestBid, onBidSuccess) {
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(Boolean(currentUser?.id));
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = currentUser?.id;

  useEffect(() => {
    let ignore = false;

    async function loadUserBalance() {
      setLoadingBalance(true);
      try {
        const data = await bidService.getUserBalance(currentUserId);
        if (!ignore) {
          const val = data?.saldoDisponible ?? data?.SaldoDisponible ?? 0;
          setBalance(Number(val));
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error al obtener balance del usuario:", err);
          setBalance(0);
        }
      } finally {
        if (!ignore) {
          setLoadingBalance(false);
        }
      }
    }

    if (currentUserId) {
      loadUserBalance();
    }

    return () => {
      ignore = true;
    };
  }, [currentUserId]);

  const refreshBalance = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await bidService.getUserBalance(currentUserId);
      const val = data?.saldoDisponible ?? data?.SaldoDisponible ?? 0;
      setBalance(Number(val));
    } catch (err) {
      console.error("Error al actualizar balance del usuario:", err);
    }
  }, [currentUserId]);

  const bids = useMemo(() => {
    return Array.isArray(latestBid) ? latestBid : latestBid ? [latestBid] : [];
  }, [latestBid]);
  const currentLeader = bids[0] || null;

  // Sugerencia automática: Precio base si no hay ofertas, o Puja Actual + Incremento Mínimo
  const suggestedBid = useMemo(() => {
    if (!auction) return 0;
    const hasBids = Boolean(
      currentLeader?.monto ||
      auction.montoActual != null ||
      auction.cantidadPujas > 0,
    );
    if (!hasBids) {
      return Number(auction.precioBase || 0);
    }
    const currentHighest =
      currentLeader?.monto ?? auction.montoActual ?? auction.precioBase;
    return Number(currentHighest) + Number(auction.incrementoMinimo);
  }, [auction, currentLeader]);

  // Indicador de estado: Liderando vs Superado (Outbid) vs Modo Espectador
  const userStatus = useMemo(() => {
    if (!currentUser?.id || !currentLeader) return "spectator";
    if (currentLeader.compradorId === currentUser.id) return "leading";
    const userHasBid = bids.some((b) => b.compradorId === currentUser.id);
    if (userHasBid) return "outbid";
    return "spectator";
  }, [currentUser, currentLeader, bids]);

  const submitBid = async (amountToBid) => {
    if (!auction || !currentUser?.id) return;
    setError(null);

    if (balance !== null && amountToBid > balance) {
      const err = new Error(
        `Saldo insuficiente: requieres $${amountToBid} pero dispones de $${balance}.`,
      );
      err.code = "INSUFFICIENT_FUNDS";
      setError(err.message);
      throw err;
    }

    try {
      setSubmitting(true);
      const result = await bidService.placeBid(
        auction.id,
        currentUser.id,
        amountToBid,
      );
      setCustomAmount("");
      refreshBalance();
      onBidSuccess?.(result);
      return result;
    } catch (err) {
      setError(err.message || "Error al enviar la oferta.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    balance,
    loadingBalance,
    suggestedBid,
    userStatus,
    customAmount,
    setCustomAmount,
    submitBid,
    submitting,
    error,
    setError,
    refreshBalance,
  };
}
