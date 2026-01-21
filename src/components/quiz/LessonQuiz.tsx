'use client'

import { useState } from 'react'
import { generateQuiz, submitQuizAttempt } from '@/actions/quiz-actions'
import { QuizQuestion } from '@/lib/ai/ai-service'
import { Loader2, CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw, Play } from 'lucide-react'

interface Props {
    lessonId: string
    courseId: string
    lessonTitle: string
    initialQuiz?: { id: string, questions: QuizQuestion[] } | null
    initialAttempts?: any[]
    isLessonCompleted?: boolean
    onComplete?: () => void
}

export default function LessonQuiz({ lessonId, courseId, lessonTitle, initialQuiz, initialAttempts = [], isLessonCompleted = false, onComplete }: Props) {
    const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'COMPLETED'>('IDLE')
    const [quiz, setQuiz] = useState<{ id: string, questions: QuizQuestion[] } | null>(initialQuiz || null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<{ questionIndex: number, selectedIndex: number }[]>([])
    const [result, setResult] = useState<{ score: number, total: number } | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // If we have a quiz and no recent result, we are ready (or could be IDLE to show "Start")
    // If we have attempts, maybe we show "Retake" or high score? 
    // For simplicity, if passed quiz exists, let's start in IDLE state "Start Quiz"

    const handleStartQuiz = async () => {
        if (quiz) {
            setStatus('READY')
            setCurrentQuestionIndex(0)
            setSelectedAnswers([])
            setResult(null)
            return
        }

        setStatus('GENERATING')
        setError(null)

        try {
            const res = await generateQuiz(lessonId, courseId)

            if (res.error) {
                setError(res.error)
                setStatus('IDLE')
                return
            }

            // We need to fetch the quiz questions now because generateQuiz only returns ID (wait, my action returned ID but not questions? let me check action)
            // Ah, I need to fetch the quiz if I only got ID. OR the action should return the quiz.
            // My action `generateQuiz` *only* returned `quizId`.
            // I should update the action to return the quiz or rely on revalidatePath to update `initialQuiz`?
            // `revalidatePath` refreshes the server component, but this is a client component state.
            // Better to just refresh the page or have an action to fetch it.
            // Wait, standard pattern: `router.refresh()`? 
            // Or simpler: let the action return the quiz data.
            // For now, I'll assume the page refreshes or I can call a getQuiz.
            // I'll assume I need to refresh the page to get the `initialQuiz` prop updated, OR I can handle it locally if I update the action.
            // But I cannot easily update the action right now without another tool call.
            // Let's use `window.location.reload()` for now? No, that's jarring.
            // I'll assume the user will reload or I'll implement a quick `getQuiz` call here?
            // Actually, I verified `src/actions/quiz-actions.ts` has `getQuiz`. I can use that!

            if (res.quizId) {
                // Import getQuiz dynamically or passed as prop? It's a server action so I can import it.
                // But I need to import it at top which I did.
                const quizData = await import('@/actions/quiz-actions').then(mod => mod.getQuiz(lessonId))
                if (quizData) {
                    setQuiz(quizData)
                    setStatus('READY')
                    setCurrentQuestionIndex(0)
                    setSelectedAnswers([])
                    setResult(null)
                } else {
                    setError("Failed to load quiz after generation")
                    setStatus('IDLE')
                }
            }
        } catch (e) {
            setError("Failed to start quiz")
            setStatus('IDLE')
        }
    }

    const handleAnswerSelect = (index: number) => {
        const newAnswers = [...selectedAnswers]
        const existing = newAnswers.findIndex(a => a.questionIndex === currentQuestionIndex)

        if (existing !== -1) {
            newAnswers[existing].selectedIndex = index
        } else {
            newAnswers.push({ questionIndex: currentQuestionIndex, selectedIndex: index })
        }

        setSelectedAnswers(newAnswers)
    }

    const handleNext = () => {
        if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        if (!quiz) return

        setStatus('COMPLETED') // Temporarily show processing/completion state

        try {
            const res = await submitQuizAttempt(quiz.id, selectedAnswers)
            if (res.error) {
                setError(res.error)
                return
            }
            if (res.success) {
                const score = res.score || 0
                const total = res.total || 10
                setResult({ score, total })

                // Check if passed (70% threshold)
                const percentage = (score / total) * 100
                if (percentage >= 70 && onComplete) {
                    onComplete()
                }
            }
        } catch (e) {
            setError("Failed to submit quiz")
        }
    }



    if (status === 'IDLE') {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy className="w-32 h-32 text-primary" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Knowledge Check</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto relative z-10">
                    Test your understanding of "{lessonTitle}" with 10 conceptual questions generated by AI.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleStartQuiz}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative z-10"
                >
                    <Play className="w-5 h-5 fill-current" />
                    {initialQuiz ? 'Start Quiz' : 'Generate & Start Quiz'}
                </button>
            </div>
        )
    }

    if (status === 'GENERATING') {
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <div className="flex justify-center mb-6">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Quiz...</h3>
                <p className="text-gray-500">
                    Analyzing transcript and crafting conceptual questions. This may take a moment.
                </p>
            </div>
        )
    }

    if (status === 'READY' && quiz) {
        const question = quiz.questions[currentQuestionIndex]
        const currentAnswer = selectedAnswers.find(a => a.questionIndex === currentQuestionIndex)?.selectedIndex
        const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1

        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                        AI Generated
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-1">
                    <div
                        className="bg-primary h-1 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                    />
                </div>

                {/* Question Area */}
                <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                        {question.question}
                    </h3>

                    <div className="space-y-3">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSelect(idx)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${currentAnswer === idx
                                    ? 'border-primary bg-blue-50'
                                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${currentAnswer === idx
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-gray-300'
                                    }`}>
                                    {currentAnswer === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <span className={currentAnswer === idx ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                                    {option}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="text-gray-500 hover:text-gray-900 font-medium disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2"
                    >
                        Previous
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentAnswer === undefined}
                        className={`flex items-center gap-2 bg-primary text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all ${currentAnswer === undefined
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                    >
                        {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
                        {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        )
    }

    if (status === 'COMPLETED' && result && quiz) {
        const percentage = Math.round((result.score / result.total) * 100)
        const passed = percentage >= 70

        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className={`p-8 text-center ${passed ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${passed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {passed ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{passed ? 'Great Job!' : 'Keep Learning!'}</h2>
                    <div className="text-5xl font-black mb-2 flex items-baseline justify-center gap-1">
                        <span className={passed ? 'text-green-600' : 'text-orange-600'}>{percentage}%</span>
                        <span className="text-xl text-gray-400 font-medium">Score</span>
                    </div>
                    <p className="text-gray-600">
                        You answered {result.score} out of {result.total} questions correctly.
                    </p>
                </div>

                <div className="p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Review Answers</h3>

                    <div className="space-y-6">
                        {quiz.questions.map((q, qIdx) => {
                            const userAnswer = selectedAnswers.find(a => a.questionIndex === qIdx)?.selectedIndex
                            const isCorrect = userAnswer === q.correctIndex

                            return (
                                <div key={qIdx} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                                    <div className="flex gap-3 mb-3">
                                        <div className="mt-1">
                                            {isCorrect
                                                ? <CheckCircle className="w-5 h-5 text-green-500" />
                                                : <XCircle className="w-5 h-5 text-red-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{q.question}</p>
                                        </div>
                                    </div>

                                    <div className="ml-8 text-sm space-y-2">
                                        <div className="flex flex-col gap-1">
                                            {q.options.map((opt, oIdx) => {
                                                const isSelected = userAnswer === oIdx
                                                const isTarget = q.correctIndex === oIdx

                                                let style = "text-gray-500"
                                                if (isTarget) style = "text-green-700 font-bold"
                                                else if (isSelected && !isTarget) style = "text-red-600 line-through"

                                                return (
                                                    <div key={oIdx} className={`flex items-center gap-2 ${style}`}>
                                                        {isTarget && <span className="text-green-500">✓</span>}
                                                        <span>{opt}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-200/50 text-gray-600 bg-white/50 p-3 rounded italic">
                                            <span className="font-semibold not-italic text-gray-900">Explanation:</span> {q.explanation}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
                        <button
                            onClick={() => {
                                // Reset state
                                setStatus('READY')
                                setCurrentQuestionIndex(0)
                                setSelectedAnswers([])
                                setResult(null)
                            }}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Retake Quiz
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
