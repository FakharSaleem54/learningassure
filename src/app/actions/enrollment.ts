'use server'

import { getSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function enroll(courseId: string) {
    const session = await getSession()
    if (!session) redirect('/login')

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
        where: {
            userId: session.userId,
            courseId: courseId
        }
    })

    if (existing) {
        redirect(`/courses/${courseId}`)
    }

    await prisma.enrollment.create({
        data: {
            userId: session.userId,
            courseId: courseId,
            progress: 0,
        }
    })

    revalidatePath(`/courses/${courseId}`)
    revalidatePath('/dashboard')
}

export async function completeCourse(courseId: string) {
    const session = await getSession()
    if (!session) redirect('/login')

    const enrollment = await prisma.enrollment.findFirst({
        where: { userId: session.userId, courseId },
        include: { certificate: true }
    })

    if (!enrollment) throw new Error('Not enrolled')

    // If already has certificate, return it
    if (enrollment.certificate) {
        return enrollment.certificate.id
    }

    // Verify ALL lessons are completed
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            modules: {
                include: {
                    lessons: true
                }
            }
        }
    })

    if (!course) throw new Error('Course not found')

    const allLessons = course.modules.flatMap(m => m.lessons)
    const completedProgress = await prisma.lessonProgress.count({
        where: {
            userId: session.userId,
            lessonId: { in: allLessons.map(l => l.id) },
            completed: true
        }
    })

    // Allow 100% video completion, ignoring "isReady" unless we want strictly only ready lessons.
    // For now, strict count match.
    if (completedProgress < allLessons.length) {
        throw new Error('All lessons must be completed before receiving a certificate.')
    }

    // Update enrollment and create certificate
    const [updatedEnrollment, certificate] = await prisma.$transaction([
        prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { completed: true, progress: 100 }
        }),
        prisma.certificate.create({
            data: {
                userId: session.userId,
                enrollmentId: enrollment.id
            }
        })
    ])

    return certificate.id
}
