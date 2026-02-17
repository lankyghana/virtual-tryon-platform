'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { jobsApi, getErrorMessage } from '@/lib/api'
import { useAuthStore, useTryonStore, Job } from '@/lib/store'
import { useJobPoller } from '@/hooks/useJobPoller'
import Link from 'next/link'

/* ── Upload Zone component ── */
function UploadZone({
  label, sublabel, preview, onFile, accept = 'image/*',
}: {
  label: string; sublabel: string; preview: string | null
  onFile: (file: File) => void; accept?: string
}) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onFile(files[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 1,
  })

  return (
    <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}
      style={{ height: 280, position: 'relative', overflow: 'hidden' }}>
      <input {...getInputProps()} />

      {preview ? (
        <>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(35,29,25,0)',
            display: 'flex', alignItems: 'flex-end', padding: 12, borderRadius: 14,
            transition: 'background 0.2s',
          }}
            className="group-hover-overlay"
          >
            <div style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(35,29,25,0.6)', backdropFilter: 'blur(6px)',
              padding: '6px 12px', borderRadius: 8,
            }}>
              <span style={{ fontSize: 11, color: 'rgba(250,247,242,0.9)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 11, color: 'rgba(196,92,42,0.9)' }}>Click to change</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: isDragActive ? 'rgba(196,92,42,0.12)' : 'rgba(164,141,115,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            {isDragActive ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v12M8 12l4-8 4 8" stroke="#c45c2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#a48d73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17,8 12,3 7,8" stroke="#a48d73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="#a48d73" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: isDragActive ? '#c45c2a' : '#574337', marginBottom: 4 }}>
              {isDragActive ? 'Drop it here' : label}
            </p>
            <p style={{ fontSize: 12, color: '#9a8c7c', lineHeight: 1.5 }}>{sublabel}</p>
          </div>
          <div style={{
            padding: '6px 16px', borderRadius: 20,
            background: '#231d19', color: '#faf7f2',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            Browse files
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Processing overlay ── */
function ProcessingState({ job, onDone }: { job: Job; onDone: () => void }) {
  const progress = job.progress ?? 0
  const stages = [
    { label: 'Human parsing', done: progress >= 20 },
    { label: 'Pose estimation', done: progress >= 40 },
    { label: 'Garment warping', done: progress >= 60 },
    { label: 'Diffusion try-on', done: progress >= 90 },
    { label: 'HD upscaling', done: progress >= 100 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 32, maxWidth: 480, margin: '0 auto' }}>
      {/* Pulsing ring */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid #e6ddd3', borderTopColor: '#c45c2a',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          border: '1px solid #f3efea', borderTopColor: 'rgba(196,92,42,0.4)',
          animation: 'spin 1.6s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 500, color: '#c45c2a', fontFamily: 'var(--font-mono)',
        }}>
          {progress}%
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
          Generating your try-on
        </h3>
        <p style={{ fontSize: 14, color: '#9a8c7c' }}>
          AI diffusion is working its magic…
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%' }}>
        <div className="progress-track" style={{ height: 4 }}>
          <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Stages */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stages.map((stage, i) => {
          const isActive = !stage.done && (i === 0 || stages[i - 1].done)
          return (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: stage.done ? '#c45c2a' : isActive ? 'rgba(196,92,42,0.15)' : 'transparent',
                border: stage.done ? 'none' : `1.5px solid ${isActive ? '#c45c2a' : '#e6ddd3'}`,
                transition: 'all 0.3s ease',
              }}>
                {stage.done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isActive ? (
                  <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#c45c2a' }} />
                ) : null}
              </div>
              <span style={{
                fontSize: 13,
                color: stage.done ? '#574337' : isActive ? '#c45c2a' : '#b8ad9f',
                fontWeight: isActive ? 500 : 400,
                transition: 'color 0.3s',
              }}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Result display ── */
function ResultState({ job, onReset }: { job: Job; onReset: () => void }) {
  const time = job.processing_time_ms ? `${(job.processing_time_ms / 1000).toFixed(1)}s` : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#4ade80',
        }} />
        <span style={{ fontSize: 12, color: '#574337', fontWeight: 500 }}>
          Try-on generated {time ? `in ${time}` : ''}
        </span>
      </div>

      {/* Result image */}
      <div style={{
        width: '100%', maxWidth: 440,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(35,29,25,0.15)',
        border: '1px solid #e6ddd3',
        position: 'relative',
      }}>
        <img
          src={job.result_image_url}
          alt="Try-on result"
          style={{ width: '100%', display: 'block' }}
        />
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(35,29,25,0.7)', backdropFilter: 'blur(6px)',
          color: '#faf7f2', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em',
          padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
        }}>
          AI Generated
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href={job.result_image_url}
          download="draped-tryon.png"
          className="btn-primary"
          style={{ textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v9M5 8l3 4 3-4M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download
        </a>
        <button onClick={onReset} className="btn-ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 4h10a4 4 0 0 1 0 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M4 1.5L1 4l3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Try another
        </button>
        <Link href="/gallery" className="btn-ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          View gallery
        </Link>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function TryOnPage() {
  const { user } = useAuthStore()
  const { currentJob, setCurrentJob, addJob, userImagePreview, garmentImagePreview, setPreviews } = useTryonStore()

  const [userFile, setUserFile] = useState<File | null>(null)
  const [garmentFile, setGarmentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [resultJob, setResultJob] = useState<Job | null>(null)

  useJobPoller(activeJobId, (job) => {
    setResultJob(job)
    setActiveJobId(null)
  })

  const handleUserFile = (file: File) => {
    setUserFile(file)
    setPreviews(URL.createObjectURL(file), garmentImagePreview)
  }

  const handleGarmentFile = (file: File) => {
    setGarmentFile(file)
    setPreviews(userImagePreview, URL.createObjectURL(file))
  }

  const handleReset = () => {
    setUserFile(null)
    setGarmentFile(null)
    setResultJob(null)
    setCurrentJob(null)
    setActiveJobId(null)
    setPreviews(null, null)
  }

  const handleSubmit = async () => {
    if (!userFile || !garmentFile) {
      toast.error('Please upload both a photo and a garment image')
      return
    }
    if (!user?.credits_remaining) {
      toast.error('No credits remaining. Upgrade to Pro for more try-ons.')
      return
    }

    setSubmitting(true)
    const toastId = toast.loading('Creating job…')
    try {
      const res = await jobsApi.create(userFile, garmentFile)
      const { job_id, status } = res.data
      const newJob: Job = {
        id: job_id, status, user_image_url: '', garment_image_url: '',
        created_at: new Date().toISOString(), progress: 0,
      }
      setCurrentJob(newJob)
      addJob(newJob)
      setActiveJobId(job_id)
      toast.success('Processing started!', { id: toastId })
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  const isProcessing = activeJobId && currentJob && !resultJob
  const canSubmit = !!userFile && !!garmentFile && !submitting && !isProcessing && !resultJob

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 400, marginBottom: 8 }}>
          Virtual Try-On
        </h1>
        <p style={{ fontSize: 14, color: '#9a8c7c' }}>
          Upload your photo and a garment to see how it looks on you.
        </p>
      </div>

      {resultJob ? (
        /* Result state */
        <div className="animate-fade-in">
          <ResultState job={resultJob} onReset={handleReset} />
        </div>
      ) : isProcessing ? (
        /* Processing state */
        <div className="card animate-fade-in" style={{ padding: 0 }}>
          <ProcessingState job={currentJob!} onDone={() => {}} />
        </div>
      ) : (
        /* Upload state */
        <div className="animate-fade-up delay-100">
          {/* Uploads grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d6e5d', marginBottom: 10 }}>
                Your photo
              </p>
              <UploadZone
                label="Upload your photo"
                sublabel="Clear, front-facing, good lighting"
                preview={userImagePreview}
                onFile={handleUserFile}
              />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d6e5d', marginBottom: 10 }}>
                Garment
              </p>
              <UploadZone
                label="Upload garment image"
                sublabel="Any shirt or top you want to try"
                preview={garmentImagePreview}
                onFile={handleGarmentFile}
              />
            </div>
          </div>

          {/* Guidelines */}
          <div style={{
            background: '#f3efea', borderRadius: 12, padding: '14px 16px',
            marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" stroke="#a48d73" strokeWidth="1.2"/>
              <path d="M8 5v3M8 10.5v.5" stroke="#a48d73" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#574337', marginBottom: 4 }}>
                For best results
              </p>
              <p style={{ fontSize: 12, color: '#7d6e5d', lineHeight: 1.6 }}>
                Use a clear front-facing photo · Solid background recommended · Full-torso visible ·
                Garment should be a shirt or top (MVP supports tops only)
              </p>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-accent"
              style={{ padding: '14px 32px', fontSize: 15 }}
            >
              {submitting ? (
                <>
                  <span className="animate-spin-slow" style={{ display: 'inline-block' }}>◌</span>
                  Submitting…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1l5 9-5 7-5-7 5-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="M4 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Generate try-on
                </>
              )}
            </button>

            {(userFile || garmentFile) && (
              <button onClick={handleReset} className="btn-ghost" style={{ fontSize: 13 }}>
                Clear
              </button>
            )}

            <span style={{ fontSize: 12, color: '#b8ad9f', marginLeft: 'auto' }}>
              {user?.credits_remaining ?? 0} try-ons remaining
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
