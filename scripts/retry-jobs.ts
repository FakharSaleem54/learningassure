import { prisma } from '@/lib/db';
import { processJob } from '@/lib/transcription/transcription-service';

async function retryFailedJobs() {
    console.log('Checking for failed transcription jobs...');

    // Find failed jobs
    const failedJobs = await prisma.transcriptionJob.findMany({
        where: { status: 'FAILED' },
        include: { lesson: true }
    });

    console.log(`Found ${failedJobs.length} failed jobs.`);

    for (const job of failedJobs) {
        console.log(`Retrying job for lesson: "${job.lesson.title}" (${job.id})...`);

        // Reset to PENDING so processJob handles it normally (though processJob doesn't strictly check status, it's good practice)
        await prisma.transcriptionJob.update({
            where: { id: job.id },
            data: { status: 'PENDING', error: null }
        });

        // Run the processing manually
        await processJob(job.id);
        console.log(`Retry complete for job ${job.id}`);
    }
}

retryFailedJobs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
