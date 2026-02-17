'use client'
import { useState, useEffect } from 'react'
import { resultsApi, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Result {
  id: string
  image_url: string
  thumbnail_url?: string
  is_favorite: boolean
  created_at: string
  job_id: string
}

function ResultCard({ result, onDelete, onFavorite }: {
  result: Result
  onDelete: (id: string) => void
  onFavorite: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const date = new Date(result.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  async function handleDelete() {
    if (!confirm('Delete this try-on?')) return
    setLoading(true)
    try {
      await resultsApi.delete(result.id)
      onDelete(result.id)
      toast.success('Deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleFavorite() {
    try {
      await resultsApi.favorite(result.id)
      onFavorite(result.id)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="card-hover" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Image */}
      <div style={{ aspectRatio: '3/4', overflow: 'hidden', position: 'relative' }}>
        <img
          src={result.image_url}
          alt="Try-on result"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(35,29,25,0.5) 0%, transparent 50%)',
          opacity: 0, transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'flex-end', padding: 12,
        }}
          className="card-overlay"
        >
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <a
              href={result.image_url}
              download="draped-tryon.png"
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, textAlign: 'center',
                background: 'rgba(250,247,242,0.9)', color: '#231d19',
                fontSize: 12, fontWeight: 500, textDecoration: 'none',
              }}
            >
              Download
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#9a8c7c' }}>{date}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleFavorite}
            style={{
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: result.is_favorite ? 'rgba(196,92,42,0.1)' : 'transparent',
              color: result.is_favorite ? '#c45c2a' : '#b8ad9f',
              fontSize: 14, transition: 'all 0.15s',
            }}
            title="Favorite"
          >
            {result.is_favorite ? '♥' : '♡'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#b8ad9f', fontSize: 12,
              transition: 'all 0.15s',
            }}
            title="Delete"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M10 3.5l-.6 6.5a1 1 0 0 1-1 .9H4.6a1 1 0 0 1-1-.9L3 3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .card-hover:hover .card-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

export default function GalleryPage() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await resultsApi.list()
        setResults(res.data.results || [])
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  const filtered = filter === 'favorites'
    ? results.filter((r) => r.is_favorite)
    : results

  function handleDelete(id: string) {
    setResults((prev) => prev.filter((r) => r.id !== id))
  }

  function handleFavorite(id: string) {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: !r.is_favorite } : r))
    )
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 400, marginBottom: 6 }}>
            Your Gallery
          </h1>
          <p style={{ fontSize: 14, color: '#9a8c7c' }}>
            {results.length} try-on{results.length !== 1 ? 's' : ''} generated
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#f3efea', padding: 4, borderRadius: 10 }}>
            {(['all', 'favorites'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: filter === f ? 500 : 400,
                  background: filter === f ? 'white' : 'transparent',
                  color: filter === f ? '#231d19' : '#9a8c7c',
                  boxShadow: filter === f ? '0 1px 4px rgba(35,29,25,0.08)' : 'none',
                  transition: 'all 0.15s', textTransform: 'capitalize',
                }}
              >
                {f === 'favorites' ? '♥ Favorites' : 'All'}
              </button>
            ))}
          </div>

          <Link href="/tryon" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: 13 }}>
            + New try-on
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card" style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
              <div className="shimmer" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 24px', gap: 16,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#f3efea', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {filter === 'favorites' ? (
              <span style={{ fontSize: 28 }}>♡</span>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="#d4c7b8" strokeWidth="1.5"/>
                <rect x="15" y="3" width="10" height="10" rx="2" stroke="#d4c7b8" strokeWidth="1.5"/>
                <rect x="3" y="15" width="10" height="10" rx="2" stroke="#d4c7b8" strokeWidth="1.5"/>
                <rect x="15" y="15" width="10" height="10" rx="2" stroke="#d4c7b8" strokeWidth="1.5"/>
              </svg>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, marginBottom: 8, color: '#574337' }}>
              {filter === 'favorites' ? 'No favorites yet' : 'No try-ons yet'}
            </h3>
            <p style={{ fontSize: 14, color: '#9a8c7c', lineHeight: 1.6, maxWidth: 300 }}>
              {filter === 'favorites'
                ? 'Heart your favorite results to find them here.'
                : 'Generate your first virtual try-on to see results here.'}
            </p>
          </div>
          {filter === 'all' && (
            <Link href="/tryon" className="btn-accent" style={{ textDecoration: 'none', marginTop: 8 }}>
              Create first try-on
            </Link>
          )}
        </div>
      ) : (
        <div
          className="animate-fade-up"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}
        >
          {filtered.map((result, i) => (
            <div key={result.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <ResultCard result={result} onDelete={handleDelete} onFavorite={handleFavorite} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
