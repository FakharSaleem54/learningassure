'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateProfile(formData: FormData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (!name || !email) {
        return { success: false, error: 'Name and email are required' }
    }

    try {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: session.userId }
            }
        })

        if (existingUser) {
            return { success: false, error: 'Email is already in use' }
        }

        await prisma.user.update({
            where: { id: session.userId },
            data: { name, email }
        })

        revalidatePath('/admin/profile')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update profile' }
    }
}

export async function changePassword(formData: FormData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Not authenticated' }
    }

    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, error: 'All fields are required' }
    }

    if (newPassword !== confirmPassword) {
        return { success: false, error: 'New passwords do not match' }
    }

    if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        const isValid = await bcrypt.compare(currentPassword, user.password)
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: session.userId },
            data: { password: hashedPassword }
        })

        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to change password' }
    }
}
