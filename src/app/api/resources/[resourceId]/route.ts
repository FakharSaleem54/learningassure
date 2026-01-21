import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync } from 'fs'
import { join } from 'path'
import { stat } from 'fs/promises'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ resourceId: string }> }
) {
    const { resourceId } = await params
    const session = await getSession()
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const resource = await prisma.lessonResource.findUnique({
        where: { id: resourceId },
        include: {
            lesson: {
                include: {
                    module: {
                        include: {
                            course: true
                        }
                    }
                }
            }
        }
    })

    if (!resource) {
        return new NextResponse('Not Found', { status: 404 })
    }

    const courseId = resource.lesson.module.courseId
    const userId = session.userId

    // Access Check:
    // 1. Instructor of the course
    // 2. Enrolled Student
    const isInstructor = resource.lesson.module.course.instructorId === userId
    let hasAccess = isInstructor

    if (!hasAccess) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                courseId,
                userId
            }
        })
        if (enrollment) {
            hasAccess = true
        }
    }

    if (!hasAccess) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    // Serve File
    try {
        const filePath = join(process.cwd(), resource.fileUrl)
        const stats = await stat(filePath)

        const stream = createReadStream(filePath)

        // @ts-ignore - Next.js response supports node streams
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf', // Assuming PDF for now, or detect mime type
                'Content-Length': stats.size.toString(),
                'Content-Disposition': `attachment; filename="${resource.fileName}"`
            }
        })
    } catch (e) {
        console.error('File read error:', e)
        return new NextResponse('File Not Found on Server', { status: 404 })
    }
}
