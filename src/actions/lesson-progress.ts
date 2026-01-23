'use server'

import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(lessonId: string, courseId: string) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    // Find existing progress or create new
    await prisma.lessonProgress.upsert({
        where: {
            userId_lessonId: {
                userId: session.userId,
                lessonId: lessonId
            }
        },
        update: {
            completed: true,
            completedAt: new Date()
        },
        create: {
            userId: session.userId,
            lessonId: lessonId,
            completed: true
        }
    })

    // Update overall course progress (simple average for now)
    // In a real app we'd calculate this more precisely based on total lessons
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { modules: { include: { lessons: true } } }
    })

    if (course) {
        const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)

        const completedLessons = await prisma.lessonProgress.count({
            where: {
                userId: session.userId,
                completed: true,
                lesson: {
                    module: {
                        courseId: courseId
                    }
                }
            }
        })

        const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

        await prisma.enrollment.updateMany({
            where: {
                userId: session.userId,
                courseId: courseId
            },
            data: {
                progress: progressPercent
            }
        })
    }

    revalidatePath(`/courses/${courseId}`)
}
