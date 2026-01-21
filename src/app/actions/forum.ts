'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { saveFile } from '@/lib/upload'

// ============ THREAD ACTIONS ============

export async function createThread(formData: FormData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'You must be logged in to create a thread' }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const courseId = formData.get('courseId') as string | null
    const tags = formData.get('tags') as string | null

    if (!title || !content) {
        return { success: false, error: 'Title and content are required' }
    }

    // Handle file uploads
    const attachments: { url: string; type: string; name: string }[] = []
    const files = formData.getAll('files') as File[]

    for (const file of files) {
        if (file.size > 0) {
            const url = await saveFile(file, 'forum')
            if (url) {
                // Determine type based on mime type
                const type = file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' : 'file'
                attachments.push({
                    url,
                    type,
                    name: file.name
                })
            }
        }
    }

    try {
        const thread = await prisma.forumThread.create({
            data: {
                title,
                content,
                authorId: session.userId,
                courseId: courseId || null,
                tags: tags || null,
                attachments: attachments.length > 0 ? attachments : undefined
            }
        })

        revalidatePath('/community')
        return { success: true, threadId: thread.id }
    } catch (error) {
        return { success: false, error: 'Failed to create thread' }
    }
}

export async function deleteThread(threadId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Not authenticated' }
    }

    const thread = await prisma.forumThread.findUnique({
        where: { id: threadId }
    })

    if (!thread) {
        return { success: false, error: 'Thread not found' }
    }

    // Only author or admin can delete
    if (thread.authorId !== session.userId && session.role !== 'ADMIN') {
        return { success: false, error: 'Not authorized' }
    }

    await prisma.forumThread.delete({
        where: { id: threadId }
    })

    revalidatePath('/community')
    return { success: true }
}

export async function incrementViewCount(threadId: string) {
    await prisma.forumThread.update({
        where: { id: threadId },
        data: { viewCount: { increment: 1 } }
    })
}

export async function toggleResolved(threadId: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Not authenticated' }

    const thread = await prisma.forumThread.findUnique({
        where: { id: threadId }
    })

    if (!thread || thread.authorId !== session.userId) {
        return { success: false, error: 'Not authorized' }
    }

    await prisma.forumThread.update({
        where: { id: threadId },
        data: { isResolved: !thread.isResolved }
    })

    revalidatePath(`/community/${threadId}`)
    return { success: true }
}

// ============ REPLY ACTIONS ============

export async function createReply(formData: FormData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'You must be logged in to reply' }
    }

    const content = formData.get('content') as string
    const threadId = formData.get('threadId') as string
    const parentId = formData.get('parentId') as string | null

    if (!content || !threadId) {
        return { success: false, error: 'Content is required' }
    }

    // Handle file uploads
    const attachments: { url: string; type: string; name: string }[] = []
    const files = formData.getAll('files') as File[]

    for (const file of files) {
        if (file.size > 0) {
            const url = await saveFile(file, 'forum')
            if (url) {
                // Determine type based on mime type
                const type = file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' : 'file'
                attachments.push({
                    url,
                    type,
                    name: file.name
                })
            }
        }
    }

    try {
        await prisma.forumReply.create({
            data: {
                content,
                authorId: session.userId,
                threadId,
                parentId: parentId || null,
                attachments: attachments.length > 0 ? attachments : undefined
            }
        })

        revalidatePath(`/community/${threadId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to create reply' }
    }
}

export async function deleteReply(replyId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Not authenticated' }
    }

    const reply = await prisma.forumReply.findUnique({
        where: { id: replyId },
        include: { thread: true }
    })

    if (!reply) {
        return { success: false, error: 'Reply not found' }
    }

    if (reply.authorId !== session.userId && session.role !== 'ADMIN') {
        return { success: false, error: 'Not authorized' }
    }

    await prisma.forumReply.delete({
        where: { id: replyId }
    })

    revalidatePath(`/community/${reply.threadId}`)
    return { success: true }
}

export async function markAsAccepted(replyId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Not authenticated' }
    }

    const reply = await prisma.forumReply.findUnique({
        where: { id: replyId },
        include: { thread: true }
    })

    if (!reply) {
        return { success: false, error: 'Reply not found' }
    }

    // Only thread author can mark as accepted
    if (reply.thread.authorId !== session.userId) {
        return { success: false, error: 'Only the thread author can accept answers' }
    }

    // Unmark any previously accepted reply
    await prisma.forumReply.updateMany({
        where: { threadId: reply.threadId, isAccepted: true },
        data: { isAccepted: false }
    })

    // Mark this reply as accepted
    await prisma.forumReply.update({
        where: { id: replyId },
        data: { isAccepted: true }
    })

    // Mark thread as resolved
    await prisma.forumThread.update({
        where: { id: reply.threadId },
        data: { isResolved: true }
    })

    revalidatePath(`/community/${reply.threadId}`)
    return { success: true }
}

// ============ VOTING ACTIONS ============

export async function voteThread(threadId: string, value: number) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'You must be logged in to vote' }
    }

    const voteValue = value > 0 ? 1 : -1

    try {
        const existingVote = await prisma.threadVote.findUnique({
            where: {
                userId_threadId: {
                    userId: session.userId,
                    threadId
                }
            }
        })

        if (existingVote) {
            if (existingVote.value === voteValue) {
                // Remove vote
                await prisma.threadVote.delete({
                    where: { id: existingVote.id }
                })
                await prisma.forumThread.update({
                    where: { id: threadId },
                    data: { upvotes: { decrement: voteValue } }
                })
            } else {
                // Change vote
                await prisma.threadVote.update({
                    where: { id: existingVote.id },
                    data: { value: voteValue }
                })
                await prisma.forumThread.update({
                    where: { id: threadId },
                    data: { upvotes: { increment: voteValue * 2 } }
                })
            }
        } else {
            // New vote
            await prisma.threadVote.create({
                data: {
                    userId: session.userId,
                    threadId,
                    value: voteValue
                }
            })
            await prisma.forumThread.update({
                where: { id: threadId },
                data: { upvotes: { increment: voteValue } }
            })
        }

        revalidatePath('/community')
        revalidatePath(`/community/${threadId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to vote' }
    }
}

export async function voteReply(replyId: string, value: number) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'You must be logged in to vote' }
    }

    const voteValue = value > 0 ? 1 : -1

    try {
        const existingVote = await prisma.replyVote.findUnique({
            where: {
                userId_replyId: {
                    userId: session.userId,
                    replyId
                }
            }
        })

        const reply = await prisma.forumReply.findUnique({
            where: { id: replyId }
        })

        if (!reply) {
            return { success: false, error: 'Reply not found' }
        }

        if (existingVote) {
            if (existingVote.value === voteValue) {
                await prisma.replyVote.delete({
                    where: { id: existingVote.id }
                })
                await prisma.forumReply.update({
                    where: { id: replyId },
                    data: { upvotes: { decrement: voteValue } }
                })
            } else {
                await prisma.replyVote.update({
                    where: { id: existingVote.id },
                    data: { value: voteValue }
                })
                await prisma.forumReply.update({
                    where: { id: replyId },
                    data: { upvotes: { increment: voteValue * 2 } }
                })
            }
        } else {
            await prisma.replyVote.create({
                data: {
                    userId: session.userId,
                    replyId,
                    value: voteValue
                }
            })
            await prisma.forumReply.update({
                where: { id: replyId },
                data: { upvotes: { increment: voteValue } }
            })
        }

        revalidatePath(`/community/${reply.threadId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to vote' }
    }
}
