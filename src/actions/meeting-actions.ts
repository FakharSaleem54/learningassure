'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { createZoomMeeting } from '@/lib/zoom'
import { createNotification } from '@/actions/notification-actions'

export async function createMeetingRequest(courseId: string, instructorId: string, objective: string, preferredTime?: string, lectureId?: string) {
    const session = await getSession()
    if (!session) {
        return { error: 'Unauthorized' }
    }

    try {
        await prisma.liveMeetingRequest.create({
            data: {
                studentId: session.userId,
                instructorId,
                courseId,
                lectureId,
                objective,
                preferredTime: preferredTime ? new Date(preferredTime) : null,
                status: 'PENDING'
            }
        })

        revalidatePath(`/courses/${courseId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to create meeting request. Error:', error)
        // Log specific prisma error if available
        if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }
        return { error: 'Failed to submit request' }
    }
}

export async function updateMeetingRequestStatus(requestId: string, status: string, data?: { meetingLink?: string, notes?: string, newTime?: string }) {
    const session = await getSession()
    if (!session || session.role !== 'INSTRUCTOR') {
        return { error: 'Unauthorized' }
    }

    try {
        const updateData: any = { status }

        // Fetch request details for notifications/zoom
        const request = await prisma.liveMeetingRequest.findUnique({
            where: { id: requestId },
            include: { student: true, course: true }
        })

        if (!request) return { error: 'Request not found' }

        if (status === 'APPROVED') {
            if (data?.notes) updateData.notes = data.notes
            if (data?.newTime) updateData.preferredTime = new Date(data.newTime)

            // Create Zoom Meeting
            const meetingTime = updateData.preferredTime || request.preferredTime || new Date()
            const zoomMeeting = await createZoomMeeting(
                `Meeting: ${request.course.title}`,
                meetingTime
            )

            updateData.zoomMeetingId = zoomMeeting.id
            updateData.zoomJoinUrl = zoomMeeting.join_url
            updateData.zoomStartUrl = zoomMeeting.start_url
            updateData.meetingLink = zoomMeeting.join_url // Backwards compatibility if needed

            // Notify Student
            await createNotification(
                request.studentId,
                `Your meeting request for "${request.course.title}" has been APPROVED.`,
                'SUCCESS',
                '/dashboard'
            )
        } else if (status === 'REJECTED') {
            if (data?.notes) updateData.notes = data.notes

            // Notify Student
            await createNotification(
                request.studentId,
                `Your meeting request for "${request.course.title}" was REJECTED.`,
                'ERROR',
                '/dashboard'
            )
        }

        await prisma.liveMeetingRequest.update({
            where: { id: requestId },
            data: updateData
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to update meeting request:', error)
        return { error: 'Failed to update status' }
    }
}
