import prisma from '@/lib/prisma';
import { generateEmbedding } from './embeddings';

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

export async function findRelevantChunks(question: string, courseId: string, limit = 5) {
    // 1. Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // 2. Fetch all chunks for the course (In a real production app with millions of vectors, we'd use a Vector DB. 
    // For a single course with a few dozen/hundred lectures, fetching metadata + vectors is fine info fit in memory).
    const chunks = await prisma.lectureChunk.findMany({
        where: { courseId },
        select: {
            id: true,
            chunkText: true,
            embedding: true,
            lectureTitle: true,
        }
    });

    // 3. Javascript-side vector search
    const scoredChunks = chunks.map(chunk => {
        const embedding = JSON.parse(chunk.embedding) as number[];
        const score = cosineSimilarity(questionEmbedding, embedding);
        return { ...chunk, score };
    });

    // 4. Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // 5. Return top K
    return scoredChunks.slice(0, limit);
}
