'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface LectureStatusBadgeProps {
    lessonId: string
    initialStatus?: string | null
    hasVideo?: boolean
}

type TranscriptionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null

export default function LectureStatusBadge({ lessonId, initialStatus, hasVideo }: LectureStatusBadgeProps) {
    const [status, setStatus] = useState<TranscriptionStatus>(initialStatus as TranscriptionStatus)
    const [isReady, setIsReady] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState(false)

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/lessons/${lessonId}/status`)
            if (response.ok) {
                const data = await response.json()
                setStatus(data.status)
                setIsReady(data.isReady)
                setError(data.error)

                // Stop polling if completed or failed
                if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                    setIsPolling(false)
                }
            }
        } catch (err) {
            console.error('Failed to fetch lesson status:', err)
        }
    }, [lessonId])

    // Start polling when status is PENDING or PROCESSING
    useEffect(() => {
        if (status === 'PENDING' || status === 'PROCESSING') {
            setIsPolling(true)
        }
    }, [status])

    // Polling effect
    useEffect(() => {
        if (!isPolling) return

        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [isPolling, fetchStatus])

    // Initial fetch if we have a video but no initial status
    useEffect(() => {
        if (hasVideo && !initialStatus) {
            fetchStatus()
        }
    }, [hasVideo, initialStatus, fetchStatus])

    // Don't render anything if no video or status is null and isReady
    if (!hasVideo || (status === null && isReady === null)) {
        return null
    }

    // Render based on status
    if (status === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                <Clock size={12} className="animate-pulse" />
                Queued
            </span>
        )
    }

    if (status === 'PROCESSING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                <Loader2 size={12} className="animate-spin" />
                Transcribing...
            </span>
        )
    }

    if (status === 'COMPLETED' || isReady === true) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                <CheckCircle size={12} />
                Ready
            </span>
        )
    }

    if (status === 'FAILED') {
        return (
            <div className="inline-flex items-center gap-2">
                <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 cursor-help"
                    title={error || 'Transcription failed'}
                >
                    <AlertCircle size={12} />
                    Failed
                </span>
                <button
                    onClick={() => {
                        setStatus('PENDING')
                        setIsPolling(true)
                        // TODO: Trigger re-transcription via API
                    }}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="Retry transcription"
                >
                    <RefreshCw size={14} />
                </button>
            </div>
        )
    }

    // Default: show nothing for lessons without processing status
    return null
}
