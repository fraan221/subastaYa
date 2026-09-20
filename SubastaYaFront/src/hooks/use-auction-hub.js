import { useEffect, useRef, useState } from 'react'
import { createAuctionHubConnection } from '@/services/auctionHub'

/**
 * Hook reactivo para gestionar la suscripción en tiempo real a una subasta específica.
 * Administra el ciclo de vida de la conexión (unirse/abandonar grupo) y los eventos NewBid,
 * AuctionExtended y BidRejected.
 * 
 * @param {number|string} auctionId - Identificador de la subasta.
 * @param {Object} callbacks - Callbacks para eventos: onNewBid, onAuctionExtended, onBidRejected.
 */
export function useAuctionHub(auctionId, callbacks = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef(null)
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  })

  useEffect(() => {
    if (!auctionId) return

    const connection = createAuctionHubConnection()
    connectionRef.current = connection

    connection.on('NewBid', (bid) => {
      callbacksRef.current.onNewBid?.(bid)
    })

    connection.on('AuctionExtended', (data) => {
      callbacksRef.current.onAuctionExtended?.(data)
    })

    connection.on('BidRejected', (data) => {
      callbacksRef.current.onBidRejected?.(data)
    })

    connection.on('AuctionFinalized', (data) => {
      callbacksRef.current.onAuctionFinalized?.(data)
    })

    connection.on('AuctionDeserted', (data) => {
      callbacksRef.current.onAuctionDeserted?.(data)
    })

    connection.onreconnecting(() => {
      setIsConnected(false)
    })

    connection.onreconnected(async () => {
      setIsConnected(true)
      await connection.invoke('JoinAuction', Number(auctionId)).catch(() => {})
    })

    connection
      .start()
      .then(async () => {
        setIsConnected(true)
        await connection.invoke('JoinAuction', Number(auctionId))
      })
      .catch((err) => {
        console.error('Error al conectar con AuctionHub:', err)
      })

    return () => {
      if (connection.state === 'Connected') {
        connection
          .invoke('LeaveAuction', Number(auctionId))
          .catch(() => {})
          .finally(() => connection.stop())
      } else {
        connection.stop()
      }
      setIsConnected(false)
    }
  }, [auctionId])

  return { isConnected }
}
