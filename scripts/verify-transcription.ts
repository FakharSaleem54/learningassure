import { prisma } from '../src/lib/db'
import { enqueueTranscription } from '../src/lib/transcription/queue'
import { processJob } from '../src/lib/transcription/transcription-service' // Imported directly to await it for testing
import { AIContextBuilder } from '../src/lib/ai/context-builder'

async function runVerification() {
    console.log("=== WRITING TEST DATA ===")

    // 1. Create a Dummy Instructor
    const user = await prisma.user.upsert({
        where: { email: 'test_instructor@example.com' },
        create: {
            email: 'test_instructor@example.com',
            password: 'hashed_password', // Dummy
            role: 'INSTRUCTOR'
        },
        update: {}
    })

    // 2. Create Dummy Course, Module, Lesson
    const course = await prisma.course.create({
        data: {
            title: 'Test Course for Transcription',
            description: 'Testing the transcription service',
            instructorId: user.id
        }
    })

    const module = await prisma.module.create({
        data: {
            title: 'Module 1',
            courseId: course.id
        }
    })

    const lesson = await prisma.lesson.create({
        data: {
            title: 'Introduction to Async Patterns',
            moduleId: module.id,
            videoUrl: 'uploads/test_video.mp4', // Mock path
            content: 'These are some instructor notes about async patterns.'
        }
    })

    console.log(`Created Lesson: ${lesson.title} (${lesson.id})`)

    // 2.5 Create Dummy Video File
    const fs = await import('fs/promises')
    const path = await import('path')
    const params = { recursive: true }
    await fs.mkdir(path.join(process.cwd(), 'public/uploads'), params)
    await fs.writeFile(path.join(process.cwd(), 'public/uploads/test_video.mp4'), 'dummy video content')

    // 3. Trigger Transcription
    console.log("\n=== TRIGGERING TRANSCRIPTION ===")
    const jobId = await enqueueTranscription(lesson.id)

    if (!jobId) {
        console.error("Failed to enqueue job")
        return
    }

    // 4. Wait for processing (In the real app this is async background, here we poll or just wait because we know processJob is async but running)
    // Actually, because we called processJob without await in queue.ts, it might race.
    // For verification consistency, lets wait a bit or direct call processJob if we imported it.
    // But `enqueueTranscription` already called it. We just need to wait for the DB to update.
    console.log("Waiting for background processing (5s)...")
    await new Promise(r => setTimeout(r, 5000))

    // 5. Check Status
    const job = await prisma.transcriptionJob.findUnique({ where: { id: jobId } })
    console.log(`Job Status: ${job?.status}`)

    const transcript = await prisma.transcript.findUnique({ where: { lessonId: lesson.id } })
    if (transcript) {
        console.log("Transcript Created Successfully!")
        console.log("Sample:", transcript.content.substring(0, 100) + "...")
    } else {
        console.error("Transcript NOT found!")
    }

    // 6. Test Context Builder
    console.log("\n=== TESTING AI CONTEXT BUILDER ===")
    const context = await AIContextBuilder.getLessonContext(lesson.id)
    if (context) {
        console.log("Context Built:")
        console.log(context.combinedContext.substring(0, 200))
    } else {
        console.error("Failed to build context")
    }

    // Cleanup
    console.log("\n=== CLEANUP ===")
    await prisma.course.delete({ where: { id: course.id } }) // Cascades
    await prisma.user.delete({ where: { id: user.id } })
    console.log("Cleanup done.")
}

runVerification().catch(console.error)
