import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { auctionService } from '@/services/auctionService'
import { bidService } from '@/services/bidService'
import { useAuctionHub } from '@/hooks/use-auction-hub'
import { LiveTimer } from '@/components/live/live-timer'
import { BidHistory } from '@/components/live/bid-history'
import { BiddingConsole } from '@/components/live/bidding-console'
import { AuctionAlerts } from '@/components/live/auction-alerts'
import { ArrowLeft, Tag, Radio, ShieldCheck } from 'lucide-react'

function LiveAuctionSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-pulse" aria-label="Cargando sala en vivo">
      <div className="h-5 w-32 bg-muted rounded-md" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="aspect-video w-full bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-7 w-2/3 bg-muted rounded-md" />
            <div className="h-4 w-full bg-muted rounded-md" />
          </div>
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-44 bg-muted rounded-xl" />
        </div>
        <div className="h-[440px] bg-muted rounded-xl" />
      </div>
    </div>
  )
}

export function LiveAuctionPage({ user }) {
  const { id } = useParams()
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([])

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ...alert }])
  }, [])

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      try {
        setLoading(true)
        const [auctionData, bidsData] = await Promise.all([
          auctionService.getAuctionById(id),
          bidService.getBidHistory(id).catch(() => []),
        ])

        if (!ignore) {
          setAuction(auctionData)
          setBids(bidsData)
        }
      } catch (err) {
        console.error('Error cargando sala en vivo:', err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchData()
    }

    return () => {
      ignore = true
    }
  }, [id])

  const handleNewBid = useCallback(
    (newBid) => {
      setBids((prev) => {
        const previousLeader = prev[0]
        if (
          user?.id &&
          newBid.compradorId !== user.id &&
          previousLeader &&
          previousLeader.compradorId === user.id
        ) {
          addAlert({
            type: 'outbid',
            message: `¡Te han superado! ${newBid.compradorSeudonimo || 'Otro postor'} ofertó $${newBid.monto}.`,
          })
        }
        return [newBid, ...prev.filter((b) => b.pujaId !== newBid.pujaId)]
      })
      setAuction((prev) => {
        if (!prev) return prev
        const updated = {
          ...prev,
          montoActual: newBid.monto,
          cantidadPujas: (prev.cantidadPujas || 0) + 1,
          ultimaPujaComprador: newBid.compradorSeudonimo,
        }
        const extDate = newBid.nuevaFechaFin || newBid.NuevaFechaFin
        if ((newBid.fueAntiSniping || newBid.FueAntiSniping) && extDate) {
          updated.fechaFin = extDate
        }
        return updated
      })
    },
    [user, addAlert]
  )

  const handleAuctionExtended = useCallback(
    (data) => {
      const nuevaFecha = data.nuevaFechaFin || data.NuevaFechaFin
      setAuction((prev) => (prev ? { ...prev, fechaFin: nuevaFecha || prev.fechaFin } : prev))
      addAlert({
        type: 'antisniping',
        message: '¡Regla Anti-Sniping! La subasta se extendió 2 minutos adicionales.',
      })
    },
    [addAlert]
  )

  const handleBidRejected = useCallback(
    (data) => {
      const targetUserId = data.compradorId ?? data.CompradorId
      const motivo = data.motivo || data.Motivo || 'Oferta no válida.'
      if (targetUserId === user?.id) {
        addAlert({
          type: 'rejected',
          message: `Oferta rechazada: ${motivo}`,
        })
      }
    },
    [user, addAlert]
  )

  const handleAuctionFinalized = useCallback(
    (data) => {
      setAuction((prev) => (prev ? { ...prev, estado: 'Finalizada' } : prev))
      const winnerId = data.ganadorId ?? data.GanadorId
      const finalAmount = data.montoFinal ?? data.MontoFinal
      const isWinner = user?.id && winnerId === user.id
      addAlert({
        type: isWinner ? 'success' : 'info',
        message: isWinner
          ? `¡Felicitaciones! Has ganado la subasta por $${finalAmount}.`
          : `Subasta finalizada. Ganador: Postor #${winnerId} por $${finalAmount}.`,
      })
    },
    [user, addAlert]
  )

  const handleAuctionDeserted = useCallback(() => {
    setAuction((prev) => (prev ? { ...prev, estado: 'Desierta' } : prev))
    addAlert({
      type: 'info',
      message: 'La subasta finalizó sin ofertas (Desierta).',
    })
  }, [addAlert])

  const hubCallbacks = useMemo(
    () => ({
      onNewBid: handleNewBid,
      onAuctionExtended: handleAuctionExtended,
      onBidRejected: handleBidRejected,
      onAuctionFinalized: handleAuctionFinalized,
      onAuctionDeserted: handleAuctionDeserted,
    }),
    [
      handleNewBid,
      handleAuctionExtended,
      handleBidRejected,
      handleAuctionFinalized,
      handleAuctionDeserted,
    ]
  )

  const { isConnected } = useAuctionHub(id, hubCallbacks)

  if (loading) {
    return <LiveAuctionSkeleton />
  }

  if (!auction) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-card rounded-xl border p-6">
        <h2 className="text-base font-semibold">Subasta no encontrada</h2>
        <p className="text-xs text-muted-foreground mt-1">
          No se pudo recuperar la información del lote solicitado.
        </p>
        <Link
          to="/subastas"
          className="text-primary font-medium underline mt-4 inline-block text-xs focus-visible:outline-2"
        >
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const latestBid = bids[0] || null

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <nav aria-label="Navegación secundaria" className="flex items-center justify-between">
        <Link
          to="/subastas"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 rounded-md"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al catálogo
        </Link>

        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2"
        >
          <span
            className={`size-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none' : 'bg-amber-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Radio className={`size-3 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} aria-hidden="true" />
            {isConnected ? 'SALA CONECTADA' : 'CONECTANDO...'}
          </span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <article className="lg:col-span-2 space-y-5">
          <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted shadow-xs">
            <img
              src={
                auction.urlImagen ||
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80'
              }
              alt={`Imagen de lote: ${auction.titulo}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs">
              <Tag className="size-3" aria-hidden="true" />
              {auction.categoriaNombre}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{auction.titulo}</h1>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Subasta Verificada
              </span>
            </div>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              {auction.descripcion}
            </p>
          </div>

          <LiveTimer
            fechaFin={auction.fechaFin}
            fechaInicio={auction.fechaInicio}
            estado={auction.estado}
          />

          <BiddingConsole
            auction={auction}
            currentUser={user}
            bids={bids}
            latestBid={latestBid}
            onBidSuccess={(bid) => {
              addAlert({
                type: 'success',
                message: `¡Puja confirmada por $${bid.monto}! Estás liderando la subasta.`,
              })
            }}
          />
        </article>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <BidHistory bids={bids} currentUserId={user?.id} />
        </aside>
      </div>

      <AuctionAlerts alerts={alerts} />
    </div>
  )
}
