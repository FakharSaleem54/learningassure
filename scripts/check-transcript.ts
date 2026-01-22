import { prisma } from '../src/lib/db';

async function checkTranscript() {
    const lecture = await prisma.lesson.findFirst({
        where: { title: 'First Lecture' },
        include: { transcript: true }
    });

    console.log('Lesson:', lecture?.title);
    console.log('Lesson ID:', lecture?.id);
    console.log('Transcript:', lecture?.transcript);
}

checkTranscript()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
