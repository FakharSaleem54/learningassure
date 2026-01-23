'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { saveSecureFile } from '@/lib/upload'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function createResource(lessonId: string, formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'INSTRUCTOR') {
        throw new Error('Unauthorized')
    }

    // Verify ownership via Lesson -> Module -> Course
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
    })

    if (!lesson || lesson.module.course.instructorId !== session.userId) {
        throw new Error('Unauthorized')
    }

    const file = formData.get('file') as File
    const title = formData.get('title') as string || file.name

    if (!file || file.size === 0) {
        throw new Error('No file provided')
    }

    const savedFile = await saveSecureFile(file, 'resources')
    if (!savedFile) {
        throw new Error('Failed to save file')
    }

    await prisma.lessonResource.create({
        data: {
            title,
            lessonId,
            fileUrl: savedFile.filePath,
            fileName: savedFile.fileName,
            fileSize: savedFile.fileSize
        }
    })

    revalidatePath(`/courses/${lesson.module.courseId}/edit`)
}

export async function deleteResource(resourceId: string) {
    const session = await getSession()
    if (!session || session.role !== 'INSTRUCTOR') {
        throw new Error('Unauthorized')
    }

    const resource = await prisma.lessonResource.findUnique({
        where: { id: resourceId },
        include: { lesson: { include: { module: { include: { course: true } } } } }
    })

    if (!resource || resource.lesson.module.course.instructorId !== session.userId) {
        throw new Error('Unauthorized')
    }

    // Determine absolute path
    // Database stores relative path like 'storage/resources/...'
    const absolutePath = join(process.cwd(), resource.fileUrl)

    try {
        await unlink(absolutePath)
    } catch (e) {
        console.error('Failed to delete file from disk:', e)
        // Continue to delete from DB even if file missing
    }

    await prisma.lessonResource.delete({
        where: { id: resourceId }
    })

    revalidatePath(`/courses/${resource.lesson.module.courseId}/edit`)
}
