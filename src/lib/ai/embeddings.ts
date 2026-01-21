// Fallback embedding implementation for development/testing
// In production, you would use a proper embedding API (OpenAI, Cohere, etc.)

// Simple hash-based mock embedding for development
// This creates deterministic embeddings based on text content
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

// Create a pseudo-embedding based on text characteristics
function createMockEmbedding(text: string, dimensions: number = 384): number[] {
    const embedding: number[] = [];
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);

    for (let i = 0; i < dimensions; i++) {
        // Create a deterministic value based on text characteristics
        const seed = simpleHash(text + i.toString());
        const normalizedValue = (Math.sin(seed) + 1) / 2; // Value between 0 and 1
        embedding.push(normalizedValue);
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
}

// Try to use @xenova/transformers, fallback to mock if unavailable
let extractor: any = null;
let useRealEmbeddings = true;
let initAttempted = false;

async function initExtractor() {
    if (initAttempted) return;
    initAttempted = true;

    try {
        // Dynamic import to avoid build-time issues
        const { pipeline } = await import('@xenova/transformers');
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('AI Embeddings: Using @xenova/transformers');
    } catch (error) {
        console.warn('AI Embeddings: @xenova/transformers not available, using mock embeddings');
        console.warn('Error:', error);
        useRealEmbeddings = false;
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    await initExtractor();

    if (extractor && useRealEmbeddings) {
        try {
            const output = await extractor(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        } catch (error) {
            console.error('Embedding generation failed, falling back to mock:', error);
            useRealEmbeddings = false;
        }
    }

    // Fallback to mock embeddings
    return createMockEmbedding(text);
}

// Simple cosine similarity for comparing embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
