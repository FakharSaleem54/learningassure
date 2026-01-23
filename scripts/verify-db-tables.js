const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTables() {
    try {
        console.log('Verifying database tables...\n');

        // Test User table
        const userCount = await prisma.user.count();
        console.log(`✓ User table exists (${userCount} users)`);

        // Test Course table
        const courseCount = await prisma.course.count();
        console.log(`✓ Course table exists (${courseCount} courses)`);

        // Test LessonProgress table (the one likely causing the error)
        const progressCount = await prisma.lessonProgress.count();
        console.log(`✓ LessonProgress table exists (${progressCount} progress records)`);

        // Test Enrollment table
        const enrollmentCount = await prisma.enrollment.count();
        console.log(`✓ Enrollment table exists (${enrollmentCount} enrollments)`);

        console.log('\n✅ All critical tables verified successfully!');
    } catch (error) {
        console.error('❌ Error verifying tables:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyTables();
