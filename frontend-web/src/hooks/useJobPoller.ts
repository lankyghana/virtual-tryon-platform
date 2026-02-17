'use client'
import { useEffect, useRef, useCallback } from 'react'
import { jobsApi } from '@/lib/api'
import { useTryonStore, Job } from '@/lib/store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

function resolveResultUrl(url: string | null | undefined) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}

export function useJobPoller(jobId: string | null, onComplete?: (job: Job) => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { updateJobStatus, currentJob } = useTryonStore()

  const poll = useCallback(async () => {
    if (!jobId) return

    try {
      const statusRes = await jobsApi.getStatus(jobId)
      const { status, progress } = statusRes.data

      updateJobStatus(jobId, { status, progress })

      if (status === 'completed') {
        const resultRes = await jobsApi.getResult(jobId)
        const { result_url, processing_time_ms } = resultRes.data
        const resolvedResultUrl = resolveResultUrl(result_url)
        updateJobStatus(jobId, {
          result_image_url: resolvedResultUrl,
          processing_time_ms,
          status: 'completed',
        })
        stopPolling()
        if (onComplete && currentJob) {
          onComplete({ ...currentJob, result_image_url: resolvedResultUrl, status: 'completed' })
        }
      } else if (status === 'failed') {
        const resultRes = await jobsApi.getResult(jobId)
        updateJobStatus(jobId, {
          error_message: resultRes.data.error_message,
          status: 'failed',
        })
        stopPolling()
      }
    } catch {
      // Silently continue polling on transient errors
    }
  }, [jobId, updateJobStatus, onComplete, currentJob])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!jobId) return
    poll()
    intervalRef.current = setInterval(poll, 2500)
    return () => stopPolling()
  }, [jobId, poll, stopPolling])

  return { stopPolling }
}
