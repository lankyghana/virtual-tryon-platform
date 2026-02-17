import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string | null
  profile_picture_url: string | null
  plan: 'free' | 'pro' | 'enterprise'
  credits_remaining: number
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'draped-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  user_image_url: string
  garment_image_url: string
  result_image_url?: string
  processing_time_ms?: number
  error_message?: string
  created_at: string
  progress?: number
}

interface TryonState {
  currentJob: Job | null
  recentJobs: Job[]
  userImagePreview: string | null
  garmentImagePreview: string | null
  setCurrentJob: (job: Job | null) => void
  updateJobStatus: (id: string, updates: Partial<Job>) => void
  addJob: (job: Job) => void
  setPreviews: (user: string | null, garment: string | null) => void
  clearPreviews: () => void
}

export const useTryonStore = create<TryonState>((set) => ({
  currentJob: null,
  recentJobs: [],
  userImagePreview: null,
  garmentImagePreview: null,

  setCurrentJob: (job) => set({ currentJob: job }),

  updateJobStatus: (id, updates) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === id
          ? { ...state.currentJob, ...updates }
          : state.currentJob,
      recentJobs: state.recentJobs.map((j) =>
        j.id === id ? { ...j, ...updates } : j
      ),
    })),

  addJob: (job) =>
    set((state) => ({
      recentJobs: [job, ...state.recentJobs].slice(0, 50),
    })),

  setPreviews: (user, garment) =>
    set({ userImagePreview: user, garmentImagePreview: garment }),

  clearPreviews: () =>
    set({ userImagePreview: null, garmentImagePreview: null }),
}))
