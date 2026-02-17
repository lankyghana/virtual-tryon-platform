import axios, { AxiosError } from 'axios'
import { useAuthStore } from './store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 → refresh or logout
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token, refresh_token } = res.data
          useAuthStore.getState().setTokens(access_token, refresh_token)
          original.headers.Authorization = `Bearer ${access_token}`
          return apiClient(original)
        } catch {
          useAuthStore.getState().logout()
        }
      }
    }
    return Promise.reject(error)
  }
)

/* ── Auth ── */
export const authApi = {
  googleLogin: (credential: string) =>
    apiClient.post('/api/v1/auth/google/login', { credential }),

  register: (name: string | undefined, email: string, password: string) =>
    apiClient.post('/api/v1/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { email, password }),

  refresh: (refresh_token: string) =>
    apiClient.post('/api/v1/auth/refresh', { refresh_token }),

  logout: () =>
    apiClient.post('/api/v1/auth/logout'),
}

/* ── Jobs ── */
export const jobsApi = {
  create: (userImage: File, garmentImage: File) => {
    const form = new FormData()
    form.append('user_image', userImage)
    form.append('garment_image', garmentImage)
    return apiClient.post('/api/v1/jobs/create', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },

  getStatus: (jobId: string) =>
    apiClient.get(`/api/v1/jobs/${jobId}/status`),

  getResult: (jobId: string) =>
    apiClient.get(`/api/v1/jobs/${jobId}/result`),

  list: (page = 1, pageSize = 20) =>
    apiClient.get('/api/v1/jobs', { params: { page, page_size: pageSize } }),

  delete: (jobId: string) =>
    apiClient.delete(`/api/v1/jobs/${jobId}`),
}

/* ── Results ── */
export const resultsApi = {
  list: (page = 1) =>
    apiClient.get('/api/v1/results', { params: { page, limit: 20 } }),

  favorite: (id: string) =>
    apiClient.post(`/api/v1/results/${id}/favorite`),

  delete: (id: string) =>
    apiClient.delete(`/api/v1/results/${id}`),
}

/* ── User ── */
export const userApi = {
  profile: () => apiClient.get('/api/v1/user/profile'),
  quota:   () => apiClient.get('/api/v1/user/quota'),
}

/* ── Helpers ── */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
