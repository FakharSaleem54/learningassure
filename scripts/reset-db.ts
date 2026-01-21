
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Cleaning Database (Progress & Enrollments Context)...')

    try {
        // 1. Delete Lesson Progress
        const deletedProgress = await prisma.lessonProgress.deleteMany({})
        console.log(`✅ Deleted ${deletedProgress.count} LessonProgress records`)

        // 2. Delete Quiz Attempts
        const deletedAttempts = await prisma.quizAttempt.deleteMany({})
        console.log(`✅ Deleted ${deletedAttempts.count} QuizAttempt records`)

        // 3. Delete Certificates
        const deletedCerts = await prisma.certificate.deleteMany({})
        console.log(`✅ Deleted ${deletedCerts.count} Certificate records`)

        // 4. Delete Enrollments
        const deletedEnrollments = await prisma.enrollment.deleteMany({})
        console.log(`✅ Deleted ${deletedEnrollments.count} Enrollment records`)

        // NOTE: We are intentionally NOT deleting Users or Lessons here by default,
        // as that would destroy the course structure and require re-seeding/manual creation.
        // If you explicitly want to delete USERS (students) or LESSONS, uncomment below:

        /*
        // 5. Delete Lessons (DANGEROUS: Deletes content)
        // const deletedLessons = await prisma.lesson.deleteMany({})
        // console.log(`Deleted ${deletedLessons.count} Lessons`)
    
        // 6. Delete Users (DANGEROUS: Deletes accounts)
        // const deletedUsers = await prisma.user.deleteMany({ where: { role: 'LEARNER' } }) // Protect instructors?
        // console.log(`Deleted ${deletedUsers.count} Users`)
        */

        console.log('✨ Clean complete! You can now test strict progression from scratch.')
    } catch (error) {
        console.error('Error cleaning database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
