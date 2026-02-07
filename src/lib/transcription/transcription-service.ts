import { prisma } from '@/lib/prisma'
import { join } from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

export async function processJob(jobId: string) {
    console.log(`[TranscriptionService] Starting processing for job ${jobId}`)

    let absoluteVideoPath: string | null = null;
    let isTempFile = false;

    try {
        // 1. Fetch Job & Lesson Details
        const job = await prisma.transcriptionJob.findUnique({
            where: { id: jobId },
            include: {
                lesson: {
                    include: {
                        module: true
                    }
                }
            }
        })

        if (!job || !job.lesson || !job.lesson.videoUrl) {
            console.error(`[TranscriptionService] Invalid job or missing video URL for job ${jobId}`)
            await updateJobStatus(jobId, 'FAILED', 'Invalid job data or missing video URL')
            return
        }

        // Update status to PROCESSING
        await updateJobStatus(jobId, 'PROCESSING')

        // 2. Resolve File Paths
        // videoUrl is likely relative like "courses/uuid/file.mp4" (db) which matches Supabase path
        let videoPath = job.lesson.videoUrl
        if (videoPath.startsWith('/')) videoPath = videoPath.substring(1) // Remove leading slash

        // Default: expect file in public/ (legacy)
        absoluteVideoPath = join(process.cwd(), 'public', videoPath)

        if (videoPath.startsWith('storage/')) {
            absoluteVideoPath = join(process.cwd(), videoPath)
        }

        // Check if file exists locally, if not try Supabase
        try {
            await fs.access(absoluteVideoPath)
            console.log(`[TranscriptionService] Found local file at ${absoluteVideoPath}`)
        } catch (e) {
            console.log(`[TranscriptionService] Local file not found, checking Supabase Storage...`)

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error } = await supabase.storage
                    .from('videos')
                    .download(videoPath);

                // Save to temp file (Use /tmp for Vercel compatibility)
                const tempDir = '/tmp';
                await fs.mkdir(tempDir, { recursive: true });
                const tempPath = join(tempDir, `download_${jobId}_${Date.now()}.mp4`);

                const buffer = Buffer.from(await data.arrayBuffer());
                await fs.writeFile(tempPath, buffer);

                absoluteVideoPath = tempPath;
                isTempFile = true;
                console.log(`[TranscriptionService] Downloaded video to temp file: ${absoluteVideoPath}`);
            } else {
                console.error(`[TranscriptionService] Supabase download failed: ${error?.message}`);
            }
        } else {
            console.error(`[TranscriptionService] Skipping Supabase check - credentials missing`);
        }
    }

        // Final check
        if (!absoluteVideoPath) {
        throw new Error("Could not result video path");
    }

    try {
        await fs.access(absoluteVideoPath)
    } catch (e) {
        console.error(`[TranscriptionService] Video file not found at ${absoluteVideoPath}`)
        await updateJobStatus(jobId, 'FAILED', 'Video file not found')
        return
    }

    // 3. Extract Audio (Simulated)
    console.log(`[TranscriptionService] Simulating audio extraction for ${absoluteVideoPath}...`)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate work

    // 4. Perform Transcription (Real Python Script)
    const transcriptText = await performRealTranscription(absoluteVideoPath)

    // 5. Save Transcript and mark lesson as ready
    await prisma.$transaction([
        prisma.transcript.upsert({
            where: { lessonId: job.lessonId },
            create: {
                lessonId: job.lessonId,
                content: transcriptText,
                language: 'en'
            },
            update: {
                content: transcriptText
            }
        }),
        prisma.transcriptionJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                updatedAt: new Date()
            }
        }),
        // Mark lesson as ready for students after successful transcription
        prisma.lesson.update({
            where: { id: job.lessonId },
            data: { isReady: true }
        })
    ])

    // 6. Generate Embeddings for RAG
    try {
        console.log(`[TranscriptionService] Generating semantic index for "${job.lesson.title}"...`)
        await generateSearchVectors(job.lesson.module?.courseId || '', job.lesson.title, transcriptText);
    } catch (vectorError) {
        console.error(`[TranscriptionService] Failed to generate embeddings:`, vectorError);
    }

    console.log(`[TranscriptionService] Job ${jobId} completed successfully`)

} catch (error) {
    console.error(`[TranscriptionService] Error processing job ${jobId}:`, error)
    await updateJobStatus(jobId, 'FAILED', (error as Error).message)
} finally {
    // Cleanup temp file
    if (isTempFile && absoluteVideoPath) {
        try {
            await fs.unlink(absoluteVideoPath)
            console.log(`[TranscriptionService] Cleaned up temp file`)
        } catch (cleanupError) {
            console.error(`[TranscriptionService] Failed to cleanup temp file:`, cleanupError)
        }
    }
}
}

async function updateJobStatus(jobId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED', error?: string) {
    await prisma.transcriptionJob.update({
        where: { id: jobId },
        data: {
            status,
            error,
            updatedAt: new Date()
        }
    })
}

// Helper to chunk and embed text
async function generateSearchVectors(courseId: string, lectureTitle: string, fullText: string) {
    // Dynamic import to avoid circular dependencies if any
    const { generateEmbedding } = await import('@/lib/ai/embeddings');

    // Simple chunking strategy: ~1000 chars overlap
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];

    for (let i = 0; i < fullText.length; i += (chunkSize - overlap)) {
        chunks.push(fullText.substring(i, i + chunkSize));
    }

    if (!courseId) return;

    // Delete old chunks for this lecture to avoid duplicates
    await prisma.lectureChunk.deleteMany({
        where: { courseId, lectureTitle }
    });

    console.log(`[TranscriptionService] Creating ${chunks.length} chunks for vector store...`);

    // Process sequentially to be safe with resources
    for (const chunkText of chunks) {
        const embedding = await generateEmbedding(chunkText);

        await prisma.lectureChunk.create({
            data: {
                courseId,
                lectureTitle,
                chunkText,
                embedding: JSON.stringify(embedding)
            }
        });
    }
}

// Real Transcription using OpenAI Whisper API
async function performRealTranscription(videoPath: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    console.log(`[TranscriptionService] Sending ${videoPath} to OpenAI Whisper API...`);

    try {
        const fileBuffer = await fs.readFile(videoPath);
        const fileName = videoPath.split(/[\\/]/).pop() || 'audio.mp4';

        // Detect file type from extension for proper Blob creation
        const extension = fileName.split('.').pop()?.toLowerCase() || 'mp4';
        const mimeType = extension === 'mp3' ? 'audio/mpeg' : 'video/mp4';

        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer], { type: mimeType }), fileName);
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[TranscriptionService] OpenAI API Error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`OpenAI Whisper API failed: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const transcript = data.text || '';

        if (!transcript.trim()) {
            console.warn('[TranscriptionService] Warning: OpenAI returned an empty transcript.');
        }

        return transcript.trim();
    } catch (error) {
        console.error('[TranscriptionService] Transcription error:', error);
        throw error;
    }
}
