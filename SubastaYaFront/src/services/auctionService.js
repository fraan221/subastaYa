import apiClient from './apiClient'

export const auctionService = {
  /**
   * Obtiene el listado paginado de subastas con filtros opcionales.
   * @param {Object} params - Parámetros de consulta
   * @param {number} [params.pagina=1] - Número de página
   * @param {number} [params.tamaño=9] - Cantidad de elementos por página
   * @param {string} [params.estado] - Estado: 'Activa' | 'Programada' | 'Finalizada' | 'Desierta'
   * @param {number} [params.categoriaId] - ID de la categoría
   * @param {string} [params.busqueda] - Término de búsqueda en el título
   * @param {number} [params.precioMin] - Precio mínimo
   * @param {number} [params.precioMax] - Precio máximo
   * @param {string} [params.ordenamiento] - Orden: 'tiempo' | 'mayor_puja'
   */
  async getAuctions({
    pagina = 1,
    tamaño = 9,
    estado,
    categoriaId,
    busqueda,
    precioMin,
    precioMax,
    ordenamiento,
  } = {}) {
    const params = { pagina, tamaño }

    if (estado) params.estado = estado
    if (categoriaId) params.categoriaId = categoriaId
    if (busqueda && busqueda.trim()) params.busqueda = busqueda.trim()
    if (precioMin !== undefined && precioMin !== null && precioMin !== '') params.precioMin = precioMin
    if (precioMax !== undefined && precioMax !== null && precioMax !== '') params.precioMax = precioMax
    if (ordenamiento) params.ordenamiento = ordenamiento

    const response = await apiClient.get('/auctions', { params })
    return response.data
  },

  /**
   * Obtiene el detalle completo de una subasta específica.
   * @param {number} id - Identificador de la subasta
   */
  async getAuctionById(id) {
    const response = await apiClient.get(`/auctions/${id}`)
    return response.data
  },

  /**
   * Obtiene la lista de categorías disponibles para filtros.
   */
  async getCategories() {
    const response = await apiClient.get('/categories')
    return response.data
  },
}
