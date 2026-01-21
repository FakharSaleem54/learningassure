const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Deleting all courses...')

    try {
        // Delete in order to respect foreign keys (if cascade isn't set perfectly)
        await prisma.lesson.deleteMany({}) // If this fails due to model missing in client, we catch it
        await prisma.module.deleteMany({})
        await prisma.enrollment.deleteMany({})

        const { count } = await prisma.course.deleteMany({})

        console.log(`✅ Deleted ${count} courses.`)
        console.log('✨ Database is clean and ready for new courses!')
    } catch (error) {
        console.error('❌ Error deleting courses:', error)

        // Fallback: If Lessons table doesn't exist or client is stale, try deleting just courses 
        // (Prisma might throw if the client doesn't know about Lessons yet but the DB does?)
        // Actually, if the client is stale, it won't have prisma.lesson.
        // So we might need to regenerate first.
    } finally {
        await prisma.$disconnect()
    }
}

main()
