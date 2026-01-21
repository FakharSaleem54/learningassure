import prisma from '@/lib/prisma'
import { join } from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function processJob(jobId: string) {
    console.log(`[TranscriptionService] Starting processing for job ${jobId}`)

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
        // videoUrl is likely relative like "/folder/file.mp4" or "storage/..."
        // We need the absolute path for ffmpeg
        let videoPath = job.lesson.videoUrl
        if (videoPath.startsWith('/')) videoPath = videoPath.substring(1) // Remove leading slash

        // Handle "storage/" paths (secure) vs "public/" paths
        // existing file saving logic suggests "public/uploads" or "storage/videos"
        // Let's assume absolute path resolution based on CWD
        let absoluteVideoPath = join(process.cwd(), 'public', videoPath)

        // If it was a secure upload (storage/...), adjust path
        if (videoPath.startsWith('storage/')) {
            absoluteVideoPath = join(process.cwd(), videoPath)
        }

        // Check if file exists
        try {
            await fs.access(absoluteVideoPath)
        } catch (e) {
            console.error(`[TranscriptionService] Video file not found at ${absoluteVideoPath}`)
            await updateJobStatus(jobId, 'FAILED', 'Video file not found')
            return
        }

        // 3. Extract Audio (Simulated for this step if ffmpeg is heavy, but let's try a lightweight check)
        // For the prototype, we will skip actual heavy ffmpeg processing to avoid timeout/resource issues
        // and just return a Mock Transcript.
        // In a real prod env, we would extract audio to a temp file here.
        // await extractAudio(absoluteVideoPath, tempAudioPath) 

        console.log(`[TranscriptionService] Simulating audio extraction for ${absoluteVideoPath}...`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate work

        // 4. Perform Transcription (Real Python Script)
        // We use the absolute path we resolved earlier
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

        // 6. Generate Embeddings for RAG (Search & Chat)
        try {
            console.log(`[TranscriptionService] Generating semantic index for "${job.lesson.title}"...`)
            await generateSearchVectors(job.lesson.module?.courseId || '', job.lesson.title, transcriptText);
        } catch (vectorError) {
            console.error(`[TranscriptionService] Failed to generate embeddings:`, vectorError);
            // We don't fail the job for this, as the transcript itself is safe
        }

        console.log(`[TranscriptionService] Job ${jobId} completed successfully`)

    } catch (error) {
        console.error(`[TranscriptionService] Error processing job ${jobId}:`, error)
        await updateJobStatus(jobId, 'FAILED', (error as Error).message)
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

    if (!courseId) return; // Should not happen if data integrity is good

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

// Real Transcription using Python script
import { spawn } from 'child_process';

async function performRealTranscription(videoPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const scriptPath = join(process.cwd(), 'src', 'lib', 'transcription', 'transcriber.py');
        console.log(`[TranscriptionService] Spawning Python script: ${scriptPath} for ${videoPath}`);

        const pythonProcess = spawn('python', [scriptPath, videoPath]);

        let transcript = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            console.log(`[Python stdout]: ${chunk}`);
            transcript += chunk;
        });

        pythonProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            console.error(`[Python stderr]: ${chunk}`);
            errorOutput += chunk;
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python transcriber failed with exit code ${code}: ${errorOutput}`));
            } else {
                if (!transcript.trim()) {
                    // If output is empty but code is 0, arguably a failure or just silent video
                    console.warn('[TranscriptionService] Warning: Transcript response was empty.');
                }
                resolve(transcript.trim());
            }
        });

        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start python process: ${err.message}`));
        });
    });
}
