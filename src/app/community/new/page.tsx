import prisma from '@/lib/prisma';
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createThread } from "@/app/actions/forum";
import { ArrowLeft, Send, Tag, BookOpen } from "lucide-react";

export default async function NewThreadPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login?redirect=/community/new");
    }

    const courses = await prisma.course.findMany({
        where: { published: true },
        select: { id: true, title: true },
    });

    async function handleSubmit(formData: FormData) {
        "use server";
        const result = await createThread(formData);
        if (result.success && result.threadId) {
            redirect(`/community/${result.threadId}`);
        }
        // If error, it will be handled client-side in a future enhancement
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Link
                href="/community"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium"
            >
                <ArrowLeft size={18} />
                Back to Forum
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary to-blue-600 text-white">
                    <h1 className="text-2xl font-bold">Start a New Discussion</h1>
                    <p className="text-blue-100 mt-2">Share your question or topic with the community</p>
                </div>

                <form action={handleSubmit} className="p-6 flex flex-col gap-6">
                    {/* Title */}
                    <div>
                        <label className="block font-medium mb-2 text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="What's your question or topic?"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block font-medium mb-2 text-gray-700">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="content"
                            required
                            rows={8}
                            placeholder="Describe your question or topic in detail. You can use Markdown for formatting."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base font-mono resize-y"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Tip: Use **bold**, *italic*, and `code` for formatting
                        </p>
                    </div>

                    {/* Course (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 font-medium mb-2 text-gray-700">
                            <BookOpen size={16} />
                            Related Course (Optional)
                        </label>
                        <select
                            name="courseId"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        >
                            <option value="">No specific course</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tags (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 font-medium mb-2 text-gray-700">
                            <Tag size={16} />
                            Tags (Optional)
                        </label>
                        <input
                            type="text"
                            name="tags"
                            placeholder="e.g., javascript, help, discussion (comma-separated)"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                        />
                    </div>

                    {/* Attachments (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 font-medium mb-2 text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            Attachments (Optional)
                        </label>
                        <input
                            type="file"
                            name="files"
                            multiple
                            accept="image/*,video/*"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Supported formats: Images and Videos
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                        <Link
                            href="/community"
                            className="px-6 py-3 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 rounded-lg text-white bg-primary hover:bg-blue-600 transition-colors shadow-sm font-bold"
                        >
                            <Send size={18} />
                            Post Thread
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
