import apiClient from "./apiClient"

export const activityService = {
  async getMyBids({ pagina = 1, tamaño = 9 } = {}) {
    const response = await apiClient.get("/activities/bids", {
      params: { pagina, tamaño },
    })

    return response.data
  },

  async getMyListings({ pagina = 1, tamaño = 9 } = {}) {
    const response = await apiClient.get("/activities/listings", {
      params: { pagina, tamaño },
    })

    return response.data
  },
}
