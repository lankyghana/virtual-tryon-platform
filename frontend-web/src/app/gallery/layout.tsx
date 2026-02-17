'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store'

const navItems = [
  {
    href: '/tryon',
    label: 'Try On',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M7 4L3 8.5V15h12V8.5L11 4" stroke={active ? '#c45c2a' : 'currentColor'} strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M7 4s.75 2.5 2 2.5S11 4 11 4" stroke={active ? '#c45c2a' : 'currentColor'} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/gallery',
    label: 'Gallery',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="2" stroke={active ? '#c45c2a' : 'currentColor'} strokeWidth="1.4"/>
        <rect x="10" y="2" width="6" height="6" rx="2" stroke={active ? '#c45c2a' : 'currentColor'} strokeWidth="1.4"/>
        <rect x="2" y="10" width="6" height="6" rx="2" stroke={active ? '#c45c2a' : 'currentColor'} strokeWidth="1.4"/>
        <rect x="10" y="10" width="6" height="6" rx="2" stroke={active ? '#c45c2a' : 'currentColor'} strokeWidth="1.4"/>
      </svg>
    ),
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'white', borderRight: '1px solid #e6ddd3',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #f3efea' }}>
          <Link href="/tryon" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #231d19 0%, #574337 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2" fill="#c45c2a"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: '#231d19' }}>
              Draped
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  fontSize: 14, fontWeight: active ? 500 : 400,
                  color: active ? '#c45c2a' : '#574337',
                  background: active ? 'rgba(196,92,42,0.08)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Quota pill */}
        {user && (
          <div style={{ padding: '12px 16px', margin: '0 12px 12px', borderRadius: 12, background: '#f3efea', border: '1px solid #e6ddd3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#7d6e5d', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Monthly quota
              </span>
              <span className={`badge ${user.plan === 'pro' ? 'badge-pro' : 'badge-free'}`}>
                {user.plan}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(user.credits_remaining / 5) * 100}%` }} />
            </div>
            <p style={{ fontSize: 11, color: '#9a8c7c', marginTop: 6 }}>
              {user.credits_remaining} try-ons remaining
            </p>
          </div>
        )}

        {/* User */}
        <div style={{ padding: '16px 16px', borderTop: '1px solid #f3efea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {user?.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt="Profile"
                width={32} height={32}
                style={{ borderRadius: '50%', border: '2px solid #e6ddd3', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#e6ddd3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, color: '#574337', flexShrink: 0,
              }}>
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#231d19', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </p>
              <p style={{ fontSize: 11, color: '#9a8c7c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '7px 12px', borderRadius: 8,
              fontSize: 13, color: '#9a8c7c', background: 'transparent',
              border: '1px solid #e6ddd3', cursor: 'pointer',
              transition: 'all 0.15s', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2v10h3M9 9.5l3-2.5-3-2.5M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
