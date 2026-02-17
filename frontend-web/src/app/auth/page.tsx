'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { authApi, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (el: HTMLElement, config: object) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function AuthPage() {
  const router = useRouter()
  const { isAuthenticated, setAuth } = useAuthStore()
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (isAuthenticated) router.push('/tryon')
  }, [isAuthenticated, router])

  // Load Google Sign-In script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  // Initialize Google button once script loads
  useEffect(() => {
    if (!scriptLoaded || !googleBtnRef.current) return

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set')
      return
    }

    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
    })

    window.google?.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 320,
    })
  }, [scriptLoaded])

  async function handleGoogleCredential(response: { credential: string }) {
    setLoading(true)
    const toastId = toast.loading('Signing in…')

    try {
      const res = await authApi.googleLogin(response.credential)
      const { access_token, refresh_token, user } = res.data

      setAuth(user, access_token, refresh_token)
      toast.success(`Welcome, ${user.name || user.email}!`, { id: toastId })
      router.push('/tryon')
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }

    setLoading(true)
    const toastId = toast.loading(mode === 'login' ? 'Signing in…' : 'Creating account…')

    try {
      const res = mode === 'login'
        ? await authApi.login(email, password)
        : await authApi.register(name || undefined, email, password)

      const { access_token, refresh_token, user } = res.data
      setAuth(user, access_token, refresh_token)
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!', { id: toastId })
      router.push('/tryon')
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Back to home */}
      <div style={{ padding: '24px 32px' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 14, color: '#7d6e5d', textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="animate-fade-up" style={{
          background: 'white', borderRadius: 24,
          border: '1px solid #e6ddd3',
          boxShadow: '0 12px 48px rgba(35,29,25,0.10)',
          padding: '48px 40px', width: '100%', maxWidth: 400,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #231d19 0%, #574337 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L21 7.5V16.5L12 21L3 16.5V7.5L12 3Z" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" fill="#c45c2a"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, textAlign: 'center', lineHeight: 1.1, color: '#231d19' }}>
                Welcome to Draped
              </h1>
              <p style={{ fontSize: 14, color: '#9a8c7c', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
                Sign in to start trying on clothes virtually
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="divider-ornament" style={{ width: '100%', marginBottom: 28, fontSize: 11 }}>
            Continue with
          </div>

          {/* Google Button */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Native Google button rendered by GSI */}
            <div
              ref={googleBtnRef}
              style={{
                minHeight: 44,
                display: 'flex', justifyContent: 'center',
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? 'none' : 'auto',
                transition: 'opacity 0.2s',
              }}
            />

            {/* Fallback manual button (shown when GSI not available) */}
            {!scriptLoaded && (
              <button
                onClick={() => toast.error('Google Sign-In is loading…')}
                className="google-btn"
                style={{ width: '100%', maxWidth: 320 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
                  <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
                  <path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" fill="#FBBC05"/>
                  <path d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="divider-ornament" style={{ width: '100%', margin: '32px 0 20px 0', fontSize: 11 }}>
            Or use email
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="name" style={{ fontSize: 12, color: '#7d6e5d' }}>Name (optional)</label>
                <input
                  className="input-field"
                  id="name"
                  name="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={{ fontSize: 12, color: '#7d6e5d' }}>Email</label>
              <input
                className="input-field"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="password" style={{ fontSize: 12, color: '#7d6e5d' }}>Password</label>
              <input
                className="input-field"
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              disabled={loading}
            >
              {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </button>
          </form>

          {/* Footer note */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#b8ad9f', lineHeight: 1.6 }}>
              By continuing, you agree to our{' '}
              <Link href="/terms" style={{ color: '#7d6e5d', textDecoration: 'underline' }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#7d6e5d', textDecoration: 'underline' }}>Privacy Policy</Link>.
              <br />Your images are auto-deleted after 30 days.
            </p>
          </div>
        </div>
      </div>

      {/* Perks strip */}
      <div style={{ borderTop: '1px solid #e6ddd3', padding: '20px 32px' }}>
        <div style={{
          maxWidth: 500, margin: '0 auto',
          display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap',
        }}>
          {[
            { icon: '🎁', text: '5 free try-ons/month' },
            { icon: '🔒', text: 'Private & secure' },
            { icon: '⚡', text: '10–20 second results' },
          ].map((perk) => (
            <span key={perk.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7d6e5d' }}>
              <span>{perk.icon}</span> {perk.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
