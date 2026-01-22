import { prisma } from './src/lib/db';

async function seedTranscript() {
    const lecture = await prisma.lesson.findFirst({
        where: { title: 'First Lecture' }
    });

    if (!lecture) {
        console.error('Lesson not found');
        return;
    }

    console.log(`Seeding transcript for: ${lecture.title} (${lecture.id})`);

    const mockContent = `
[00:00:00] Instructor: Hello everyone, and welcome to the First Lecture of our course.
[00:00:10] Instructor: In this session, we are going to cover the fundamental principles of our subject.
[00:00:30] Instructor: First, let's talk about the history. This field started back in the 1980s with the advent of personal computing.
[00:01:00] Instructor: The key concept you need to remember is "Abstraction". Abstraction allows us to handle complexity by hiding unnecessary details.
[00:02:00] Instructor: For example, when you drive a car, you don't need to know how the engine works internally. You just use the steering wheel and pedals. That is an interface to the abstraction.
[00:03:00] Instructor: We will also look at "Encapsulation" and "Polymorphism" later in the course.
[00:04:00] Instructor: Please remember to read Chapter 1 of the textbook.
    `.trim();

    await prisma.transcript.upsert({
        where: { lessonId: lecture.id },
        create: {
            lessonId: lecture.id,
            content: mockContent,
            language: 'en'
        },
        update: {
            content: mockContent
        }
    });

    console.log('Transcript seeded successfully.');

    // Also seed embeddings for RAG
    const { generateEmbedding } = await import('./src/lib/ai/embeddings');
    const embedding = await generateEmbedding(mockContent);

    // Check for module ID to get course ID
    const lessonWithModule = await prisma.lesson.findUnique({
        where: { id: lecture.id },
        include: { module: true }
    });

    if (lessonWithModule?.module?.courseId) {
        await prisma.lectureChunk.deleteMany({
            where: { lectureTitle: lecture.title }
        });

        await prisma.lectureChunk.create({
            data: {
                courseId: lessonWithModule.module.courseId,
                lectureTitle: lecture.title,
                chunkText: mockContent,
                embedding: JSON.stringify(embedding)
            }
        });
        console.log('Embeddings seeded successfully.');
    }
}

seedTranscript()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
