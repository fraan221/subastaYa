import * as signalR from '@microsoft/signalr'

/**
 * Crea e inicializa una instancia de HubConnection para comunicarse en tiempo real
 * con el AuctionHub del backend mediante WebSockets.
 */
export function createAuctionHubConnection() {
  const hubUrl = import.meta.env.VITE_HUB_URL || '/hubs/auction'

  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => localStorage.getItem('subastaya_token') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Information)
    .build()
}
