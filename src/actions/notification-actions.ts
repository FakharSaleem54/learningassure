'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function createNotification(userId: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO', link?: string) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                message,
                type,
                link,
                read: false
            }
        })
    } catch (error) {
        console.error('Failed to create notification:', error)
    }
}

export async function getUserNotifications() {
    const session = await getSession()
    if (!session) return []

    return await prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 20
    })
}

export async function markNotificationAsRead(notificationId: string) {
    const session = await getSession()
    if (!session) return

    await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    })
}
