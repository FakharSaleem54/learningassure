import { prisma } from '../src/lib/db';
import { indexLecture } from '../src/lib/ai/indexer';

async function main() {
    const course = await prisma.course.findFirst({
        include: {
            modules: {
                include: { lessons: true }
            }
        }
    });

    if (!course) {
        console.log('No courses found.');
        return;
    }

    console.log(`Indexing course: ${course.title} (${course.id})`);

    let count = 0;
    for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
            if (lesson.content) {
                console.log(`Indexing lesson: ${lesson.title}`);
                await indexLecture(course.id, lesson.id, lesson.title, lesson.content);
                count++;
            }
        }
    }
    console.log(`Indexed ${count} lessons.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
