'use server';

import { indexLecture } from '@/lib/ai/indexer';
import prisma from '@/lib/prisma';

export async function indexLectureAction(courseId: string, lectureId: string) {
    try {
        const lecture = await prisma.lesson.findUnique({
            where: { id: lectureId }
        });

        if (!lecture) {
            return { success: false, error: 'Lecture not found' };
        }

        // Combine content and possibly video transcript if we had it but for now just 'content'
        const textToIndex = lecture.content || "";

        if (!textToIndex || textToIndex.trim().length === 0) {
            return { success: false, error: 'No content to index. Please add text content to this lecture first.' };
        }

        await indexLecture(courseId, lectureId, lecture.title, textToIndex);
        return { success: true };
    } catch (error: any) {
        console.error("Indexing failed:", error);
        // Provide more specific error messages
        const errorMessage = error?.message || 'Unknown error';
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
            return { success: false, error: 'Network error while generating embeddings' };
        }
        if (errorMessage.includes('model') || errorMessage.includes('pipeline')) {
            return { success: false, error: 'AI model loading failed. Please try again.' };
        }
        return { success: false, error: `Failed to index: ${errorMessage.substring(0, 100)}` };
    }
}
