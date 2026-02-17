'use client'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/tryon')
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-[#faf7f2]">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #231d19 0%, #574337 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="#faf7f2" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#c45c2a"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: '#231d19' }}>
            Draped
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="btn-ghost text-sm py-2 px-5">Sign in</Link>
          <Link href="/auth" className="btn-primary text-sm py-2 px-5">
            Try free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Background blob */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, 0)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(196,92,42,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-up">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 100,
              background: 'rgba(196,92,42,0.08)', border: '1px solid rgba(196,92,42,0.2)',
              fontSize: 12, fontWeight: 500, color: '#c45c2a',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              marginBottom: 32,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c45c2a', display: 'inline-block' }} />
              AI-Powered Fashion
            </span>
          </div>

          <h1 className="animate-fade-up delay-100" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            color: '#231d19',
            marginBottom: 28,
          }}>
            See yourself in
            <em style={{ fontStyle: 'italic', color: '#c45c2a' }}> any outfit</em>
            <br />before you buy it
          </h1>

          <p className="animate-fade-up delay-200" style={{
            fontSize: 18, color: '#7d6e5d', maxWidth: 500, margin: '0 auto 40px',
            lineHeight: 1.7, fontWeight: 300,
          }}>
            Upload your photo and a garment image. Our diffusion AI generates
            a photorealistic try-on in under 20 seconds.
          </p>

          <div className="animate-fade-up delay-300 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/auth" className="btn-accent" style={{ padding: '14px 32px', fontSize: 15 }}>
              Start trying on — it's free
            </Link>
            <a href="#how-it-works" className="btn-ghost" style={{ padding: '14px 24px', fontSize: 15 }}>
              See how it works
            </a>
          </div>

          <p className="animate-fade-up delay-400" style={{
            fontSize: 12, color: '#9a8c7c', marginTop: 20,
          }}>
            No credit card required · 5 free try-ons monthly
          </p>
        </div>

        {/* ── Preview mockup ── */}
        <div className="animate-fade-up delay-500 mt-20 max-w-5xl mx-auto">
          <div style={{
            background: 'white', borderRadius: 24,
            border: '1px solid #e6ddd3',
            boxShadow: '0 24px 80px rgba(35,29,25,0.12)',
            padding: 32, overflow: 'hidden',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              {/* Upload panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a8c7c' }}>Your photo</p>
                <div style={{
                  height: 240, borderRadius: 16,
                  background: 'linear-gradient(160deg, #f3efea 0%, #e8ddd3 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed #d4c7b8',
                }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="17" stroke="#d4c7b8" strokeWidth="1.5"/>
                    <circle cx="18" cy="15" r="5" stroke="#b8ad9f" strokeWidth="1.5"/>
                    <path d="M6 30c2-6 6-9 12-9s10 3 12 9" stroke="#b8ad9f" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Garment panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a8c7c' }}>Garment</p>
                <div style={{
                  height: 240, borderRadius: 16,
                  background: 'linear-gradient(160deg, #e8f0f8 0%, #d4e2f0 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed #b8c8d8',
                }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M12 8l-6 8v14h24V16l-6-8" stroke="#8aa4be" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M12 8s1.5 4 6 4 6-4 6-4" stroke="#8aa4be" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Result panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a8c7c' }}>Result</p>
                <div style={{
                  height: 240, borderRadius: 16,
                  background: 'linear-gradient(160deg, #f5f0eb 0%, #e8d8c8 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: '#c45c2a', color: 'white',
                    fontSize: 10, fontWeight: 500,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    AI Generated
                  </div>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M18 4L32 28H4L18 4Z" stroke="#c45c2a" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="18" cy="20" r="3" fill="#c45c2a"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#9a8c7c' }}>
                <span>Generating try-on…</span>
                <span>~15s remaining</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-8 flex-wrap">
          {[
            { value: '10–20s', label: 'Generation time' },
            { value: '5 free', label: 'Try-ons monthly' },
            { value: 'HD', label: '1024×1536 output' },
            { value: 'Private', label: 'Auto-deleted images' },
          ].map((stat) => (
            <div key={stat.label} className="stat-pill flex-col items-center text-center" style={{ gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: '#231d19' }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 11, color: '#9a8c7c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c45c2a', marginBottom: 12 }}>
              How it works
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400 }}>
              Three steps to your look
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                num: '01',
                title: 'Upload your photo',
                desc: 'Take or upload a clear front-facing photo in good lighting. We handle the rest.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="11" r="5" stroke="#c45c2a" strokeWidth="1.5"/>
                    <path d="M4 24c2-6 5-9 10-9s8 3 10 9" stroke="#c45c2a" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                num: '02',
                title: 'Choose a garment',
                desc: 'Upload any top or shirt image — from brand sites, your camera roll, or anywhere.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M10 6L4 14v10h20V14L18 6" stroke="#c45c2a" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M10 6s1 4 4 4 4-4 4-4" stroke="#c45c2a" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                num: '03',
                title: 'Get your try-on',
                desc: 'Our diffusion AI generates a photorealistic composite in 10–20 seconds. Download it.',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="4" y="4" width="20" height="20" rx="4" stroke="#c45c2a" strokeWidth="1.5"/>
                    <path d="M9 14l4 4 6-6" stroke="#c45c2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map((step) => (
              <div key={step.num} className="card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 16 }}>{step.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c45c2a', marginBottom: 8 }}>
                  {step.num}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#7d6e5d', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div style={{
            background: '#231d19', borderRadius: 28, padding: '60px 40px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '20%', left: '30%',
              width: 300, height: 300, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(196,92,42,0.15) 0%, transparent 70%)',
              filter: 'blur(30px)', pointerEvents: 'none',
            }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c45c2a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              Start today
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 400, color: '#faf7f2', marginBottom: 20 }}>
              Try before you buy,<br/>
              <em style={{ color: '#c45c2a', fontStyle: 'italic' }}>every single time</em>
            </h2>
            <p style={{ fontSize: 15, color: '#9a8c7c', marginBottom: 32, lineHeight: 1.7 }}>
              5 free try-ons every month. No credit card needed.
            </p>
            <Link href="/auth" className="btn-accent" style={{ padding: '14px 36px', fontSize: 15 }}>
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #e6ddd3', padding: '32px 40px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#574337' }}>
            Draped
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#9a8c7c' }}>
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
            <span>© 2026 Draped</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
