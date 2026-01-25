import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { enroll } from '@/app/actions/enrollment'
import { redirect } from 'next/navigation'
import CoursePlayer from '@/components/CoursePlayer'

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params
    const session = await getSession()

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            instructor: { select: { id: true } },
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: {
                        orderBy: { order: 'asc' },
                        include: {
                            resources: true,
                            transcript: true,
                            quiz: {
                                include: {
                                    attempts: {
                                        where: { userId: session?.userId },
                                        orderBy: { completedAt: 'desc' },
                                        take: 1
                                    }
                                }
                            },
                            progress: {
                                where: { userId: session?.userId }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!course) return <div>Course not found</div>

    let enrollment = null
    let studentName = ''

    if (session) {
        enrollment = await prisma.enrollment.findFirst({
            where: { userId: session.userId, courseId: course.id },
            include: { certificate: true, user: { select: { name: true } } }
        })
        studentName = enrollment?.user?.name || 'Student'
    }
    const isEnrolled = !!enrollment

    // Sales View
    if (!isEnrolled) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{course.title}</h1>
                <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">{course.description}</p>

                <div className="p-10 bg-white rounded-2xl shadow-xl border border-gray-100 mb-16 max-w-md mx-auto transform transition-transform hover:-translate-y-1">
                    <p className="text-5xl font-bold mb-8 text-primary">
                        {Number(course.price) === 0 ? 'Free' : `$${Number(course.price)}`}
                    </p>
                    <form action={enroll.bind(null, course.id)}>
                        <button className="w-full py-4 px-8 text-lg font-bold text-white bg-primary rounded-xl shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all hover:-translate-y-0.5">
                            Enroll Now
                        </button>
                    </form>
                    <p className="mt-4 text-sm text-gray-400">Full lifetime access • Certificate of completion</p>
                </div>

                <div className="text-left max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                        <span>📚</span> Course Curriculum
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {course.modules.length === 0 ? (
                            <p className="p-6 text-gray-500 italic">Curriculum content coming soon.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {course.modules.map((m: any, i: number) => (
                                    <li key={m.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </span>
                                        <span className="font-medium text-gray-700">{m.title}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Learner View (Interactive Player)
    if (!enrollment) return null; // Should be handled by !isEnrolled above, but satisfies TS

    // Server Action Button for completion
    const completionButton = enrollment.completed ? (
        <a href={`/certificates/${enrollment.certificate?.id}`} className="btn btn-primary">View Certificate</a>
    ) : (
        <form action={async () => {
            'use server'
            const { completeCourse } = await import('@/app/actions/enrollment')
            await completeCourse(course.id)
        }}>
            <button className="btn btn-primary">Mark Course as Complete & Get Certificate</button>
        </form>
    );

    // Serialize for Client Components
    // Filter out lessons that aren't ready for students (instructors can see all)
    const isInstructor = session?.userId === course.instructor.id
    const { getSignedVideoUrl } = await import('@/lib/video-utils')

    const modulesWithSignedUrls = await Promise.all(course.modules.map(async (mod) => ({
        ...mod,
        lessons: await Promise.all(mod.lessons
            // Only show lessons where isReady=true for students, instructors see all
            .filter((lesson: any) => isInstructor || lesson.isReady !== false)
            .map(async (lesson: any) => {
                // If videoUrl is a Supabase path (doesn't start with http), sign it
                const signedUrl = lesson.videoUrl ? await getSignedVideoUrl(lesson.videoUrl) : null;

                return {
                    ...lesson,
                    videoUrl: signedUrl,
                    resources: lesson.resources.map((res: any) => ({
                        ...res,
                        createdAt: res.createdAt.toISOString()
                    })),
                    transcript: lesson.transcript ? lesson.transcript.content : null,
                    quiz: lesson.quiz ? {
                        id: lesson.quiz.id,
                        questions: lesson.quiz.questions
                    } : null,
                    attempts: lesson.quiz?.attempts || [],
                    isCompleted: lesson.progress?.[0]?.completed || false
                };
            }))
    })));

    const serializedCourse = {
        ...course,
        price: Number(course.price),
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        modules: modulesWithSignedUrls
    }

    return (
        <CoursePlayer
            course={serializedCourse}
            modules={serializedCourse.modules as any}
            completionButton={completionButton}
            instructorId={course.instructor.id}
            studentName={studentName}
            isInstructor={isInstructor}
        />
    )
}
