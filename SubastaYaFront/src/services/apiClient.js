import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de Request: inyecta el token JWT si está disponible
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('subastaya_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de Response: normaliza los errores emitidos por el backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const mensaje =
      error.response?.data?.mensaje ||
      error.response?.data?.title ||
      error.message ||
      'Error inesperado de comunicación con el servidor.'

    if (status === 401) {
      localStorage.removeItem('subastaya_token')
      localStorage.removeItem('subastaya_user')
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    const customError = new Error(mensaje)
    customError.status = status
    customError.data = error.response?.data
    return Promise.reject(customError)
  }
)

export default apiClient
