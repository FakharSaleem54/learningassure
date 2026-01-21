
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function CoursesPage() {
    const courses = await prisma.course.findMany({
        where: { published: true },
        include: { instructor: true }
    })

    return (
        <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold mb-10 text-gray-900">Available Courses</h1>
            {courses.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-xl text-gray-500 font-medium">No courses available at the moment.</p>
                    <p className="mt-2 text-gray-400">Check back soon for new content!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map((course: any) => (
                        <div key={course.id} className="group bg-white border border-gray-100 rounded-xl flex flex-col shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden">
                            <div className="aspect-video relative bg-gray-100">
                                <img
                                    src={course.thumbnail || 'https://placehold.co/600x400?text=Course'}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h2 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">{course.title}</h2>
                                <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">👤</span>
                                    Instructor: <span className="font-medium text-gray-700">{course.instructor.name || 'Unknown'}</span>
                                </p>
                                <p className="text-gray-600 mb-6 flex-1 line-clamp-3 leading-relaxed">{course.description}</p>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                                    <span className="font-bold text-2xl text-gray-900">${course.price.toFixed(2)}</span>
                                    <Link href={`/courses/${course.id}`} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm">
                                        View Course
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
