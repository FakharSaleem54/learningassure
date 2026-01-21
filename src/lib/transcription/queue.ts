import { prisma } from '@/lib/db'
import { processJob } from './transcription-service'

export async function enqueueTranscription(lessonId: string) {
    console.log(`[Queue] Enqueuing transcription for lesson ${lessonId}`)

    try {
        // 1. Create or update the job record
        // We use upsert to handle cases where a job might already exist (e.g. re-upload)
        const job = await prisma.transcriptionJob.upsert({
            where: { lessonId },
            create: {
                lessonId,
                status: 'PENDING',
                attempts: 0
            },
            update: {
                status: 'PENDING',
                error: null,
                attempts: 0,
                updatedAt: new Date()
            }
        })

        // 2. Trigger background processing (Fire-and-forget)
        // We do NOT await this, so the user response is fast
        processJob(job.id).catch(err => {
            console.error(`[Queue] Uncaught error in background process for job ${job.id}:`, err)
        })

        console.log(`[Queue] Job ${job.id} created and processing triggered`)
        return job.id
    } catch (error) {
        console.error(`[Queue] Failed to enqueue job for lesson ${lessonId}:`, error)
        // We might want to rethrow or handle gracefully depending on caller expectation
        // For now, logging is sufficient as this is an auxiliary service
        return null
    }
}
