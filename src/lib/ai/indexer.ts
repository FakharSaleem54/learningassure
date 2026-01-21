import { prisma } from '@/lib/db';
import { generateEmbedding } from './embeddings';

// Helper to chunk text
function chunkText(text: string, maxWords = 400): string[] {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk: string[] = [];

    for (const word of words) {
        currentChunk.push(word);
        if (currentChunk.length >= maxWords) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
}

export async function indexLecture(courseId: string, lectureId: string, lectureTitle: string, content: string) {
    if (!content) return;

    // 1. Remove existing chunks for this lecture to avoid duplicates if re-indexing
    await prisma.lectureChunk.deleteMany({
        where: {
            AND: [
                { courseId },
                { lectureTitle } // We don't have lectureId in Schema yet, but using Title is a proxy. 
                // Actually Schema has `lectureTitle` but not `lectureId` link. 
                // Ideally we should have linked it, but for now we follow the schema requested.
            ]
        }
    });

    // 2. Chunk the text
    const chunks = chunkText(content);

    // 3. Generate embeddings and save
    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        await prisma.lectureChunk.create({
            data: {
                courseId,
                lectureTitle,
                chunkText: chunk,
                embedding: JSON.stringify(embedding),
            }
        });
    }
}
