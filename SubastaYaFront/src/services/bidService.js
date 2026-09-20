import apiClient from './apiClient'

export const bidService = {
  /**
   * Envía una nueva oferta (puja) para una subasta activa.
   * @param {number|string} auctionId - Identificador de la subasta.
   * @param {number|string} compradorId - Identificador del usuario postor.
   * @param {number} monto - Monto ofertado.
   */
  async placeBid(auctionId, compradorId, monto) {
    const response = await apiClient.post(`/auctions/${auctionId}/bids`, {
      compradorId,
      monto,
    })
    return response.data
  },

  /**
   * Consulta el balance financiero disponible de la billetera del usuario.
   * @param {number|string} userId - Identificador del usuario.
   */
  async getUserBalance(userId) {
    const response = await apiClient.get(`/wallet/${userId}/balance`)
    return response.data
  },

  /**
   * Obtiene el historial cronológico de todas las ofertas de una subasta.
   * @param {number|string} auctionId - Identificador de la subasta.
   */
  async getBidHistory(auctionId) {
    const response = await apiClient.get(`/auctions/${auctionId}/bids`)
    return response.data
  },
}
