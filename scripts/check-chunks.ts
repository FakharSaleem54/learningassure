import { prisma } from '../src/lib/db';

async function main() {
    const count = await prisma.lectureChunk.count();
    console.log(`Total LectureChunks: ${count}`);

    if (count > 0) {
        const first = await prisma.lectureChunk.findFirst();
        console.log('Sample chunk:', first?.lectureTitle, first?.chunkText.substring(0, 50));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
