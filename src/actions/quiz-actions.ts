'use server'

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { generateQuizQuestions } from "@/lib/ai/ai-service"
import { revalidatePath } from "next/cache"

export async function generateQuiz(lessonId: string, courseId: string) {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    try {
        // Check if quiz already exists
        const existingQuiz = await prisma.quiz.findUnique({
            where: { lessonId }
        })

        if (existingQuiz) {
            return { quizId: existingQuiz.id }
        }

        // Get lesson with transcript
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { transcript: true }
        })

        if (!lesson) return { error: "Lesson not found" }
        if (!lesson.transcript?.content) return { error: "No transcript available for this lesson" }

        // Generate questions via AI
        const { questions, error } = await generateQuizQuestions(lesson.transcript.content, lesson.title)

        if (error || !questions || questions.length === 0) {
            return { error: error || "Failed to generate quiz questions" }
        }

        // Save to DB
        const quiz = await prisma.quiz.create({
            data: {
                lessonId,
                questions: questions as any // JSONB
            }
        })

        revalidatePath(`/courses/${courseId}`)
        return { quizId: quiz.id }

    } catch (error) {
        console.error("[Quiz Action] Error:", error)
        return { error: "Internal server error" }
    }
}

export async function getQuiz(lessonId: string) {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { lessonId }
        })

        if (!quiz) return null

        return {
            id: quiz.id,
            questions: quiz.questions as any
        }
    } catch (error) {
        console.error("[Quiz Action] Error fetching quiz:", error)
        return null
    }
}

export async function submitQuizAttempt(quizId: string, answers: { questionIndex: number, selectedIndex: number }[]) {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId }
        })

        if (!quiz) return { error: "Quiz not found" }

        const questions = quiz.questions as any[]
        let score = 0

        // Calculate score
        answers.forEach(ans => {
            const question = questions[ans.questionIndex]
            if (question && question.correctIndex === ans.selectedIndex) {
                score++
            }
        })

        // Save attempt
        const attempt = await prisma.quizAttempt.create({
            data: {
                quizId,
                userId: session.userId,
                score,
                totalQuestions: questions.length,
                answers: answers as any
            }
        })

        return {
            success: true,
            score,
            total: questions.length,
            attemptId: attempt.id
        }

    } catch (error) {
        console.error("[Quiz Action] Error submitting attempt:", error)
        return { error: "Failed to submit quiz" }
    }
}

export async function getQuizAttempts(quizId: string) {
    const session = await getSession()
    if (!session) return { error: "Unauthorized" }

    try {
        const attempts = await prisma.quizAttempt.findMany({
            where: {
                quizId,
                userId: session.userId
            },
            orderBy: { completedAt: 'desc' }
        })

        return { attempts }
    } catch (error) {
        return { error: "Failed to fetch attempts" }
    }
}
