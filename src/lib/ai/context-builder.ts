import { prisma } from '@/lib/prisma'

interface LessonContext {
    lessonTitle: string;
    instructorNotes: string;
    transcript: string | null;
    combinedContext: string;
}

export class AIContextBuilder {

    /**
     * Retrieves and constructs the AI context for a specific lesson.
     * Combines instructor notes (lesson.content) and video transcript.
     */
    static async getLessonContext(lessonId: string): Promise<LessonContext | null> {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                transcript: true
            }
        })

        if (!lesson) return null

        const instructorNotes = lesson.content || ''
        const transcript = lesson.transcript?.content || null

        const combinedContext = this.buildPromptContext(lesson.title, instructorNotes, transcript)

        return {
            lessonTitle: lesson.title,
            instructorNotes,
            transcript,
            combinedContext
        }
    }

    /**
     * Formats the context into a clear structure for the LLM.
     */
    private static buildPromptContext(title: string, notes: string, transcript: string | null): string {
        let context = `Title: ${title}\n\n`

        if (notes && notes.trim().length > 0) {
            context += `[INSTRUCTOR NOTES]\n${notes}\n\n`
        }

        if (transcript && transcript.trim().length > 0) {
            // Optimize transcript if it's too long
            const optimizedTranscript = this.optimizeTranscript(transcript)
            context += `[VIDEO TRANSCRIPT]\n${optimizedTranscript}\n\n`
        }

        return context
    }

    /**
     * Optimizes the transcript for token usage.
     * Simple implementation: Truncates if extremely long, or could implement chunking.
     * For now, we'll cap at ~10,000 characters to be safe for typical LLM windows 
     * while preserving the most relevant parts (start and end often contain summaries).
     */
    private static optimizeTranscript(transcript: string): string {
        const MAX_LENGTH = 15000;
        if (transcript.length <= MAX_LENGTH) return transcript;

        // If too long, keep first 60% and last 20% (assuming middle is less critical elaboration or we just need to cut something)
        // Or just hard truncate for simplicity in v1.

        const keepStart = Math.floor(MAX_LENGTH * 0.7);
        const keepEnd = MAX_LENGTH - keepStart;

        return transcript.substring(0, keepStart) +
            "\n...[TRANSCRIPT TRUNCATED FOR LENGTH]...\n" +
            transcript.substring(transcript.length - keepEnd);
    }
}
