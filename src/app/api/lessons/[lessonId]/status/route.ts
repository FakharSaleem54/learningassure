import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        const { lessonId } = await params
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                transcriptionJob: {
                    select: {
                        status: true,
                        error: true,
                        updatedAt: true
                    }
                },
                module: {
                    select: {
                        course: {
                            select: {
                                instructorId: true
                            }
                        }
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        // Only instructors who own the course can check status
        if (lesson.module.course.instructorId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({
            isReady: lesson.isReady,
            status: lesson.transcriptionJob?.status || null,
            error: lesson.transcriptionJob?.error || null,
            updatedAt: lesson.transcriptionJob?.updatedAt?.toISOString() || null
        })
    } catch (error) {
        console.error('[API] Lesson status error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
