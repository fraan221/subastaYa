import apiClient from './apiClient';

export const walletService = {
  /**
   * Obtiene el desglose de saldos (Total, Retenido, Disponible).
   * @param {number} [usuarioId]
   */
  async getBalance(usuarioId) {
    const params = usuarioId ? { usuarioId } : {};
    const response = await apiClient.get('/wallet/balance', { params });
    return response.data;
  },

  /**
   * Acredita saldo simulado a la billetera.
   * @param {{ usuarioId: number, monto: number }} payload
   */
  async deposit(payload) {
    const response = await apiClient.post('/wallet/deposit', payload);
    return response.data;
  },

  /**
   * Obtiene el historial de movimientos de la billetera.
   * @param {number} [usuarioId]
   */
  async getTransactions(usuarioId) {
    const params = usuarioId ? { usuarioId } : {};
    const response = await apiClient.get('/wallet/transactions', { params });
    return response.data;
  },
};
