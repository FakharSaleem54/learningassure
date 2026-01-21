import EditCourseForm from '@/components/EditCourseForm'
import LessonManager from '@/components/LessonManager'
import Link from 'next/link'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { addModule, deleteModule, publishCourse } from '@/app/actions/course'

// Next.js 15: props.params and props.searchParams are promises
export default async function EditCoursePage({
    params,
    searchParams
}: {
    params: Promise<{ courseId: string }>,
    searchParams: Promise<{ moduleId?: string }>
}) {
    const { courseId } = await params
    const { moduleId } = await searchParams

    const session = await getSession()
    if (!session || session.role !== 'INSTRUCTOR') redirect('/')

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: {
                        orderBy: { order: 'asc' },
                        include: {
                            resources: true,
                            transcriptionJob: {
                                select: { status: true, error: true }
                            },
                            transcript: { select: { content: true } }
                        }
                    }
                }
            }
        }
    })

    if (!course || course.instructorId !== session.userId) redirect('/')

    const activeModule = moduleId ? course.modules.find((m: any) => m.id === moduleId) : null

    // Serialize for Client Components
    const serializedCourse = {
        ...course,
        price: Number(course.price),
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        modules: course.modules.map(mod => ({
            ...mod,
            lessons: mod.lessons.map(lesson => ({
                ...lesson,
            }))
        }))
    }

    const serializedActiveModule = activeModule ? {
        ...activeModule,
        lessons: activeModule.lessons.map((lesson: any) => ({
            ...lesson,
            resources: lesson.resources?.map((res: any) => ({
                ...res,
                createdAt: res.createdAt.toISOString()
            })) || [],
            transcriptionJob: lesson.transcriptionJob || null,
            transcript: lesson.transcript || null
        }))
    } : null

    return (
        <div className="container" style={{ padding: '2rem 1rem', display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '2rem' }}>
            {/* Sidebar: Modules List */}
            <aside style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', height: 'fit-content', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Curriculum</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {course.modules.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No modules yet.</p>}
                    {course.modules.map((module: any, index: number) => {
                        const isActive = module.id === moduleId;
                        return (
                            <div key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Link
                                    href={`/courses/${courseId}/edit?moduleId=${module.id}`}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: isActive ? 'var(--primary-color)' : 'var(--background)',
                                        color: isActive ? 'white' : 'var(--text-main)',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                        display: 'block'
                                    }}
                                >
                                    <span style={{ fontWeight: 500, marginRight: '0.5rem' }}>{index + 1}.</span> {module.title}
                                </Link>
                                <form action={deleteModule.bind(null, module.id)}>
                                    <button className="btn btn-sm" style={{ padding: '0.25rem', color: 'var(--text-muted)' }} title="Delete Module">✕</button>
                                </form>
                            </div>
                        )
                    })}
                </div>

                <form action={addModule.bind(null, courseId)}>
                    <input name="title" placeholder="New Module Title" required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem' }}>+ Add Module</button>
                </form>

                <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link href={`/courses/${courseId}/edit`} className="btn btn-outline" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                        ⚙️ Course Settings
                    </Link>
                    <form action={publishCourse.bind(null, courseId)}>
                        <button className="btn" style={{ width: '100%', background: course.published ? 'var(--success-color)' : 'var(--text-main)', color: 'white' }}>
                            {course.published ? 'Course Published' : 'Publish Course'}
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main: Content Editor */}
            <main>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Edit Course</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{course.title}</p>
                </div>

                {serializedActiveModule ? (
                    <div>
                        <LessonManager module={serializedActiveModule} />
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <EditCourseForm course={serializedCourse} />
                    </div>
                )}
            </main>
        </div>
    )
}
