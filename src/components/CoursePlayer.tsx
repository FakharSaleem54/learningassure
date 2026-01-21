'use client'

import { useState } from 'react'
import VideoPlayer from './VideoPlayer'
import Link from 'next/link'
import LiveMeetingRequestModal from './LiveMeetingRequestModal'
import CourseChat from './CourseChat'
import LessonQuiz from './quiz/LessonQuiz'
import { QuizQuestion } from '@/lib/ai/ai-service'

type Lesson = {
    id: string
    title: string
    content: string | null
    videoUrl: string | null
    order: number
    resources?: {
        id: string
        title: string
        fileName: string
    }[]
    transcript?: string | null
    quiz?: { id: string, questions: QuizQuestion[] } | null
    attempts?: any[]
    isCompleted?: boolean
    isLocked?: boolean
}

type Module = {
    id: string
    title: string
    order: number
    lessons: Lesson[]
}

type Course = {
    id: string
    title: string
}

type Props = {
    course: Course
    modules: Module[]
    completionButton: React.ReactNode
    instructorId: string
    studentName: string
    isInstructor: boolean
}

export default function CoursePlayer({ course, modules, completionButton, instructorId, studentName, isInstructor }: Props) {
    // Process modules to calculate locks
    const processedModules = modules.map((module, mIndex) => ({
        ...module,
        lessons: module.lessons.map((lesson, lIndex) => {
            // Instructor sees everything unlocked
            if (isInstructor) return { ...lesson, isLocked: false };

            // Logic: dependent on PREVIOUS lesson in the linear sequence
            // We need a flat list index
            return lesson; // Placeholder, see below
        })
    }));

    // Create a flat list to calculate locks easily
    const flatLessons = modules.flatMap(m => m.lessons);

    // Calculate locks
    const lessonsWithLocks = modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(lesson => {
            if (isInstructor) return { ...lesson, isLocked: false };

            const currentIndex = flatLessons.findIndex(l => l.id === lesson.id);
            if (currentIndex === 0) return { ...lesson, isLocked: false }; // First lesson always unlocked

            const prevLesson = flatLessons[currentIndex - 1];
            // Locked if previous is NOT completed
            return {
                ...lesson,
                isLocked: !prevLesson.isCompleted
            };
        })
    }));

    // Find first lesson to start (first unlocked or last active)
    const firstLesson = lessonsWithLocks[0]?.lessons?.[0] || null
    const [activeLessonId, setActiveLessonId] = useState<string | null>(firstLesson?.id || null)

    // Flatten lessons to find active one easily
    const allLessons = lessonsWithLocks.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })))
    const activeLesson = allLessons.find(l => l.id === activeLessonId)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="bg-white border-r border-gray-200 p-6 h-full overflow-y-auto flex flex-col">
                <div className="mb-8">
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-primary mb-4 flex items-center gap-2 transition-colors">
                        ← Back to Dashboard
                    </Link>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{course.title}</h3>
                </div>

                <div className="flex flex-col gap-6 flex-1">
                    {lessonsWithLocks.map((m, i) => (
                        <div key={m.id}>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Module {i + 1}: {m.title}
                            </div>
                            <div className="flex flex-col gap-1">
                                {m.lessons.length === 0 && <div className="text-sm text-gray-400 italic px-2">No lessons</div>}
                                {m.lessons.map((lesson: any, j: number) => (
                                    <button
                                        key={lesson.id}
                                        disabled={lesson.isLocked}
                                        onClick={() => !lesson.isLocked && setActiveLessonId(lesson.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 ${activeLessonId === lesson.id
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : lesson.isLocked
                                                ? 'text-gray-400 cursor-not-allowed bg-gray-50/50'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="opacity-60 text-xs w-5">
                                            {lesson.isLocked ? '🔒' : lesson.isCompleted ? '✅' : `${j + 1}.`}
                                        </span>
                                        <span className="truncate flex-1">{lesson.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    {/* Chat moved to floating widget */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="p-6 lg:p-12 w-full max-w-5xl mx-auto">
                {activeLesson ? (
                    <div>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                            <div>
                                <div className="text-sm text-primary font-medium mb-1">
                                    {activeLesson.moduleTitle}
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">{activeLesson.title}</h1>
                            </div>
                            <LiveMeetingRequestModal
                                courseId={course.id}
                                instructorId={instructorId}
                                lectureId={activeLesson.id}
                                studentName={studentName}
                            />
                        </div>

                        <div className="mb-8 rounded-xl overflow-hidden shadow-sm bg-black aspect-video">
                            <VideoPlayer url={activeLesson.videoUrl} title={activeLesson.title} />
                        </div>

                        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-gray-600 leading-relaxed">
                            <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
                                <h3 className="text-xl font-bold text-gray-900 border-b-2 border-primary pb-2 -mb-[1px]">Lesson Notes</h3>
                                {/* Simple tab like headers if we had state, but for now let's just stack them or adding a simple section below */}
                            </div>

                            {activeLesson.content ? (
                                <div className="prose max-w-none text-gray-600 mb-8">
                                    <p>{activeLesson.content}</p>
                                </div>
                            ) : (
                                <p className="text-gray-400 italic mb-8">No notes available for this lesson.</p>
                            )}

                            {/* Transcript Section - Only visible to instructors */}
                            {isInstructor && activeLesson.transcript && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span>📝</span> Video Transcript
                                    </h3>
                                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                                        {activeLesson.transcript.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeLesson.resources && activeLesson.resources.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h4 className="text-md font-semibold mb-4 text-gray-900">Downloadable Resources</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeLesson.resources.map(res => (
                                            <a
                                                key={res.id}
                                                href={`/api/resources/${res.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary hover:bg-white transition-all group"
                                            >
                                                <span className="text-2xl">📄</span>
                                                <div className="overflow-hidden">
                                                    <div className="text-sm font-medium text-gray-700 truncate group-hover:text-primary transition-colors">
                                                        {res.title || res.fileName}
                                                    </div>
                                                    <div className="text-xs text-gray-400">PDF Document</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Quiz Section */}
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <LessonQuiz
                                    key={activeLesson.id}
                                    lessonId={activeLesson.id}
                                    courseId={course.id}
                                    lessonTitle={activeLesson.title}
                                    initialQuiz={activeLesson.quiz}
                                    initialAttempts={activeLesson.attempts}
                                    isLessonCompleted={activeLesson.isCompleted || false}
                                    onComplete={async () => {
                                        const { markLessonComplete } = await import('@/actions/lesson-progress');
                                        await markLessonComplete(activeLesson.id, course.id);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-12 flex justify-end">
                            {completionButton}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-xl">Select a lesson from the sidebar to start watching.</p>
                    </div>
                )}
            </main>

            {/* Floating Chat Widget */}
            <CourseChat courseId={course.id} activeLessonTitle={activeLesson?.title} activeLessonId={activeLesson?.id} />
        </div>
    )
}
