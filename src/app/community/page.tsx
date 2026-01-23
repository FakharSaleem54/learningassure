import { prisma } from '@/lib/prisma';
import { getSession } from "@/lib/session";
import Link from "next/link";
import ThreadCard from "@/components/forum/ThreadCard";
import CourseFilter from "@/components/forum/CourseFilter";
import { Plus, Search, TrendingUp, Clock, MessageSquare } from "lucide-react";

export default async function CommunityPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; course?: string; search?: string }>;
}) {
    const { sort = "recent", course, search } = await searchParams;
    const session = await getSession();

    // Build query
    const where: any = {};
    if (course) where.courseId = course;
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { content: { contains: search } },
        ];
    }

    // Build orderBy
    let orderBy: any = { createdAt: "desc" };
    if (sort === "popular") orderBy = { upvotes: "desc" };
    if (sort === "replies") orderBy = { replies: { _count: "desc" } };

    const threads = await prisma.forumThread.findMany({
        where,
        orderBy,
        include: {
            author: { select: { name: true, id: true } },
            course: { select: { title: true } },
            _count: { select: { replies: true } },
        },
        take: 20,
    });

    const courses = await prisma.course.findMany({
        where: { published: true },
        select: { id: true, title: true },
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Community Forum</h1>
                    <p className="text-gray-600">Ask questions, share knowledge, and connect with other learners</p>
                </div>
                {session && (
                    <Link
                        href="/community/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium"
                    >
                        <Plus size={18} />
                        New Thread
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 items-start md:items-center">
                {/* Search */}
                <form className="flex-1 w-full md:w-auto relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Search threads..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                    />
                </form>

                {/* Sort */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-sm">
                    <Link
                        href="/community?sort=recent"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors border ${sort === "recent"
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <Clock size={16} /> Recent
                    </Link>
                    <Link
                        href="/community?sort=popular"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors border ${sort === "popular"
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <TrendingUp size={16} /> Popular
                    </Link>
                    <Link
                        href="/community?sort=replies"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors border ${sort === "replies"
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <MessageSquare size={16} /> Most Replies
                    </Link>
                </div>

                {/* Course Filter */}
                <CourseFilter courses={courses} currentCourse={course} />
            </div>

            {/* Thread List */}
            <div className="flex flex-col gap-4">
                {threads.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="flex justify-center mb-4 text-gray-300">
                            <MessageSquare size={48} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No threads yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to start a discussion!</p>
                        {session && (
                            <Link href="/community/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600">
                                Create First Thread
                            </Link>
                        )}
                    </div>
                ) : (
                    threads.map((thread) => (
                        <ThreadCard key={thread.id} thread={thread} />
                    ))
                )}
            </div>

            {/* Login Prompt */}
            {!session && (
                <div className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100">
                    <p className="text-lg text-gray-800 mb-4">
                        <strong>Join the discussion!</strong> Log in to create threads and reply to others.
                    </p>
                    <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-sm">Log In</Link>
                </div>
            )}
        </div>
    );
}
