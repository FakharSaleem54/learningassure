import prisma from '@/lib/prisma';
import CourseActions from "@/components/admin/CourseActions";
import { Search, Filter, BookOpen } from "lucide-react";

export default async function CoursesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const { status: statusFilter } = await searchParams;

    const courses = await prisma.course.findMany({
        where: {
            status: statusFilter,
        },
        include: {
            instructor: true,
            _count: {
                select: { enrollments: true }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                    <p className="text-gray-500">Approve, reject, and manage courses.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        {/* Filter Placeholder - In real app, this would be a client component adjusting URL */}
                        <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500">
                            <option>All Statuses</option>
                            <option>Pending</option>
                            <option>Active</option>
                            <option>Rejected</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <Filter size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Course</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Instructor</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Price</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Created</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {courses.map((course) => (
                            <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{course.title}</h4>
                                            <p className="text-xs text-gray-500">{course._count.enrollments} students</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">{course.instructor.name || "Unknown"}</p>
                                        <p className="text-gray-500 text-xs">{course.instructor.email}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        course.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {course.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(course.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <CourseActions courseId={course.id} status={course.status} />
                                </td>
                            </tr>
                        ))}

                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No courses found using the current filters.
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
            </div>
        </div>
    );
}
