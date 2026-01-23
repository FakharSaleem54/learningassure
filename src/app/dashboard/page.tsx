import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import InstructorMeetingDashboard from '@/components/InstructorMeetingDashboard'
import StudentMeetingDashboard from '@/components/StudentMeetingDashboard'
import GamificationStats from '@/components/gamification/GamificationStats'
import BadgeDisplay from '@/components/gamification/BadgeDisplay'
import { getUserCertificates } from '@/actions/certificate-actions'
import { Award, Scroll } from 'lucide-react'

export default async function DashboardPage() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            courses: true, // For instructors: courses they serve
            enrollments: {
                include: { course: true }
            }
        }
    })

    if (!user) {
        redirect('/login') // Should clean up cookie if user deleted
    }

    // Fetch meeting requests for instructor
    let meetingRequests: any[] = []
    if (user?.role === 'INSTRUCTOR') {
        meetingRequests = await prisma.liveMeetingRequest.findMany({
            where: { instructorId: user.id },
            include: {
                student: { select: { name: true } },
                course: { select: { title: true } },
                lecture: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    // Fetch meeting requests for student
    let studentMeetingRequests: any[] = []
    let certificates: any[] = []

    if (user?.role === 'LEARNER') {
        studentMeetingRequests = await prisma.liveMeetingRequest.findMany({
            where: { studentId: user.id },
            include: {
                instructor: { select: { name: true } },
                course: { select: { title: true } },
                lecture: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        const certRes = await getUserCertificates();
        if (certRes.success) {
            certificates = certRes.certificates || [];
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Welcome back, {user.name}!</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {user.role}
                    </span>
                </div>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Progress</h2>
                <div className="grid gap-6">
                    <GamificationStats />
                    <BadgeDisplay />
                </div>
            </section>

            {user.role === 'INSTRUCTOR' && (
                <>
                    <section className="mb-16">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Live Meeting Requests</h2>
                        </div>
                        <InstructorMeetingDashboard requests={meetingRequests} />
                    </section>

                    <section className="mb-16">
                        {/* ... (existing My Courses section) */}

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
                            <Link href="/courses/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 transition-colors">
                                + Create New Course
                            </Link>
                        </div>

                        {user.courses.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
                                <Link href="/courses/new" className="text-primary font-medium hover:underline">Get started now</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {user.courses.map((course: any) => (
                                    <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <h3 className="text-lg font-bold mb-2 text-gray-900">{course.title}</h3>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {course.description}
                                        </p>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${course.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {course.published ? 'Published' : 'Draft'}
                                            </span>
                                            <Link href={`/courses/${course.id}/edit`} className="text-sm font-medium text-primary hover:text-blue-700">
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {user.role === 'LEARNER' && (
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">My Meeting Requests</h2>
                    </div>
                    <StudentMeetingDashboard requests={studentMeetingRequests} />
                </section>
            )}

            {user.role === 'LEARNER' && (
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Award className="text-orange-500 w-6 h-6" /> My Certificates
                        </h2>
                    </div>

                    {certificates.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
                            <div className="flex justify-center mb-4 text-gray-300">
                                <Scroll size={48} />
                            </div>
                            <p className="text-gray-500">Complete courses to earn certificates!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certificates.map((cert: any) => (
                                <div key={cert.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute -top-4 -right-4 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Award size={120} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 relative z-10">{cert.enrollment.course.title}</h3>
                                    <p className="text-sm text-gray-500 mb-6 relative z-10">
                                        Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                                    </p>
                                    <Link
                                        href={`/certificates/${cert.id}`}
                                        className="inline-flex justify-center w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors relative z-10"
                                    >
                                        View Certificate
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
