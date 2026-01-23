import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function MyLearningPage() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            enrollments: {
                include: { course: true }
            }
        }
    })

    if (!user) {
        redirect('/login')
    }

    // Explicitly check for LEARNER role, though functionally anyone with enrollments could see this.
    // Requirement implies "for learners", but sticking to role check makes sense for consistency.
    if (user.role !== 'LEARNER' && user.enrollments.length === 0) {
        // Fallback for instructors who might accidentally click or if we decide to show it for everyone
        // For now, let's just render the grid.
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Learning</h1>
                <p className="text-gray-500">Track your progress and continue learning.</p>
            </div>

            {user.enrollments.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-200 shadow-sm">
                    <p className="text-gray-500 mb-4">You are not enrolled in any courses.</p>
                    <Link href="/courses" className="inline-block px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">Browse Courses</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.enrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 flex flex-col overflow-hidden group">
                            <div className="aspect-video relative bg-gray-100">
                                <img
                                    src={enrollment.course.thumbnail || 'https://placehold.co/600x400?text=Course'}
                                    alt={enrollment.course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-2">{enrollment.course.title}</h3>
                                <div className="w-full h-2 bg-gray-100 rounded-full my-4 overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Number(enrollment.progress)}%` }} />
                                </div>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-sm text-gray-500 font-medium">{Number(enrollment.progress)}% Complete</span>
                                    <Link href={`/courses/${enrollment.course.id}`} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                        Continue
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
