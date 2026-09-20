import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { auctionService } from '@/services/auctionService'
import { bidService } from '@/services/bidService'
import { useAuctionHub } from '@/hooks/use-auction-hub'
import { LiveTimer } from '@/components/live/live-timer'
import { BidHistory } from '@/components/live/bid-history'
import { BiddingConsole } from '@/components/live/bidding-console'
import { AuctionAlerts } from '@/components/live/auction-alerts'
import { ArrowLeft, Tag, Radio } from 'lucide-react'

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
            message: `¡Te han superado! ${newBid.compradorSeudonimo || 'Otro postor'} acaba de ofertar $${newBid.monto}.`,
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
        message:
          '¡Regla Anti-Sniping! La subasta se ha extendido 2 minutos adicionales debido a una oferta de último momento.',
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
          : `La subasta ha finalizado. Ganador: Postor #${winnerId} por $${finalAmount}.`,
      })
    },
    [user, addAlert]
  )

  const handleAuctionDeserted = useCallback(() => {
    setAuction((prev) => (prev ? { ...prev, estado: 'Desierta' } : prev))
    addAlert({
      type: 'info',
      message: 'La subasta ha finalizado sin ofertas (Desierta).',
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
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <span className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground font-medium text-sm">Cargando sala en vivo...</span>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Subasta no encontrada</h2>
        <p className="text-sm text-muted-foreground mt-1">
          No se pudo recuperar la información del lote solicitado.
        </p>
        <Link
          to="/subastas"
          className="text-primary font-medium underline mt-4 inline-block text-sm"
        >
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const latestBid = bids[0] || null

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/subastas"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al catálogo
        </Link>

        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Radio className={`size-3 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
            {isConnected ? 'SALA EN VIVO CONECTADA' : 'CONECTANDO...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted shadow-sm">
            <img
              src={
                auction.urlImagen ||
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80'
              }
              alt={auction.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs">
              <Tag className="size-3.5" />
              {auction.categoriaNombre}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{auction.titulo}</h1>
            <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
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
                message: `¡Puja confirmada por $${bid.monto}! Ahora estás liderando la subasta.`,
              })
            }}
          />
        </div>

        <div className="space-y-6">
          <BidHistory bids={bids} currentUserId={user?.id} />
        </div>
      </div>

      <AuctionAlerts alerts={alerts} />
    </div>
  )
}
