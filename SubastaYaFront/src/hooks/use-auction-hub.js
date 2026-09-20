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

    let isCancelled = false
    const connection = createAuctionHubConnection()
    connectionRef.current = connection

    connection.on('NewBid', (bid) => {
      if (!isCancelled) callbacksRef.current.onNewBid?.(bid)
    })

    connection.on('AuctionExtended', (data) => {
      if (!isCancelled) callbacksRef.current.onAuctionExtended?.(data)
    })

    connection.on('BidRejected', (data) => {
      if (!isCancelled) callbacksRef.current.onBidRejected?.(data)
    })

    connection.on('AuctionFinalized', (data) => {
      if (!isCancelled) callbacksRef.current.onAuctionFinalized?.(data)
    })

    connection.on('AuctionDeserted', (data) => {
      if (!isCancelled) callbacksRef.current.onAuctionDeserted?.(data)
    })

    connection.onreconnecting(() => {
      if (!isCancelled) setIsConnected(false)
    })

    connection.onreconnected(async () => {
      if (!isCancelled) {
        setIsConnected(true)
        await connection.invoke('JoinAuction', Number(auctionId)).catch(() => {})
      }
    })

    connection
      .start()
      .then(async () => {
        if (isCancelled) {
          connection.stop()
          return
        }
        setIsConnected(true)
        await connection.invoke('JoinAuction', Number(auctionId))
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Error al conectar con AuctionHub:', err)
        }
      })

    return () => {
      isCancelled = true
      connection.off('NewBid')
      connection.off('AuctionExtended')
      connection.off('BidRejected')
      connection.off('AuctionFinalized')
      connection.off('AuctionDeserted')
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
