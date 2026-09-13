import apiClient from './apiClient'

const TOKEN_KEY = 'subastaya_token'
const USER_KEY = 'subastaya_user'

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password })
    const { token, usuarioId, nombre, email: userEmail } = response.data

    const user = {
      id: usuarioId,
      nombre,
      email: userEmail,
    }

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    return { token, user }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  async getMe() {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  async ping() {
    const response = await apiClient.get('/auth/ping')
    return response.data
  },
}
