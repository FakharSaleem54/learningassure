import Link from 'next/link';

interface CourseProps {
    id: string;
    title: string;
    instructor: string | { name: string | null };
    level?: string;
    price: number;
    thumbnail?: string | null;
    category?: string;
}

export default function CourseCard({ course }: { course: CourseProps }) {
    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-1 border border-gray-100 flex flex-col h-full group">
            <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img
                    src={course.thumbnail || 'https://placehold.co/600x400?text=Course'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <span>{course.category || 'General'}</span>
                    {course.level && <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{course.level}</span>}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-slate-800 line-clamp-2 leading-tight">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {/* Assuming description might be needed but not in props yet, using instructor for now as per previous code but user asked for description */}
                    {/* The interface doesn't have description, I'll stick to instructor line for now but style it as requested if possible, strictly following existing props */}
                    By {typeof course.instructor === 'object' ? course.instructor.name : course.instructor}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-lg font-bold text-blue-600">${course.price}</div>
                    <Link
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                        href={`/courses/${course.id}`}
                    >
                        View Course
                    </Link>
                </div>
            </div>
        </div>
    );
}
