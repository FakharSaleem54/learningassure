import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { incrementViewCount } from "@/app/actions/forum";
import VoteButtons from "@/components/forum/VoteButtons";
import ReplyForm from "@/components/forum/ReplyForm";
import ReplyItem from "@/components/forum/ReplyItem";
import { ArrowLeft, Eye, MessageSquare, Clock, CheckCircle, User, Tag } from "lucide-react";

export default async function ThreadDetailsPage({
    params,
}: {
    params: Promise<{ threadId: string }>;
}) {
    const { threadId } = await params;
    const session = await getSession();

    const thread = await prisma.forumThread.findUnique({
        where: { id: threadId },
        include: {
            author: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
            replies: {
                where: { parentId: null }, // Only top-level replies
                include: {
                    author: { select: { id: true, name: true } },
                    children: {
                        include: {
                            author: { select: { id: true, name: true } },
                            children: {
                                include: {
                                    author: { select: { id: true, name: true } },
                                }
                            }
                        }
                    }
                },
                orderBy: [{ isAccepted: "desc" }, { upvotes: "desc" }, { createdAt: "asc" }],
            },
            _count: { select: { replies: true } },
        },
    });

    if (!thread) {
        notFound();
    }

    // Increment view count (fire and forget)
    incrementViewCount(threadId);

    // Get user's votes
    let userThreadVote = 0;
    const userReplyVotes: Record<string, number> = {};
    if (session) {
        const threadVote = await prisma.threadVote.findUnique({
            where: { userId_threadId: { userId: session.userId, threadId } },
        });
        userThreadVote = threadVote?.value || 0;

        const replyVotes = await prisma.replyVote.findMany({
            where: { userId: session.userId, reply: { threadId } },
        });
        replyVotes.forEach((v) => (userReplyVotes[v.replyId] = v.value));
    }

    const createdAt = new Date(thread.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Link */}
            <Link
                href="/community"
                className="inline-flex items-center gap-2 text-primary hover:text-blue-700 font-medium mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Forum
            </Link>

            {/* Thread Card */}
            <div className={`bg-white rounded-xl shadow-sm mb-8 overflow-hidden ${thread.isResolved ? "border-2 border-green-500" : "border border-gray-200"}`}>
                <div className="flex gap-4 md:gap-6 p-6">
                    {/* Vote Buttons */}
                    <div className="shrink-0">
                        <VoteButtons
                            itemId={thread.id}
                            itemType="thread"
                            currentVotes={thread.upvotes}
                            userVote={userThreadVote}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {thread.isResolved && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                                    <CheckCircle size={14} /> Resolved
                                </span>
                            )}
                            {thread.course && (
                                <Link
                                    href={`/courses/${thread.course.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                                >
                                    {thread.course.title}
                                </Link>
                            )}
                            {thread.tags && thread.tags.split(",").map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                                >
                                    <Tag size={12} /> {tag.trim()}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 leading-tight">
                            {thread.title}
                        </h1>

                        {/* Content */}
                        <div className="prose max-w-none text-gray-700 mb-6 whitespace-pre-wrap">
                            {thread.content}
                        </div>

                        {/* Attachments */}
                        {thread.attachments && Array.isArray(thread.attachments) && (
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(thread.attachments as any[]).map((file, idx) => (
                                    <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                                        {file.type === 'image' ? (
                                            <img
                                                src={file.url}
                                                alt={file.name}
                                                className="w-full h-auto object-cover max-h-[400px]"
                                            />
                                        ) : file.type === 'video' ? (
                                            <video
                                                src={file.url}
                                                controls
                                                className="w-full h-auto max-h-[400px]"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-50 flex items-center gap-2">
                                                <span className="text-gray-500 text-sm">Attachment:</span>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                                    {file.name}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <User size={14} /> {thread.author.name || "Anonymous"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} /> {createdAt}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye size={14} /> {thread.viewCount} views
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare size={14} /> {thread._count.replies} replies
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Replies Section */}
            <div className="mb-16">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-2">
                    {thread._count.replies} {thread._count.replies === 1 ? "Reply" : "Replies"}
                </h2>

                {/* Reply List */}
                {thread.replies.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {thread.replies.map((reply) => (
                            <ReplyItem
                                key={reply.id}
                                reply={reply as any}
                                threadId={thread.id}
                                threadAuthorId={thread.author.id}
                                currentUserId={session?.userId}
                                userVote={userReplyVotes[reply.id]}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                        <p>No replies yet. Be the first to respond!</p>
                    </div>
                )}

                {/* Reply Form */}
                {session ? (
                    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">
                            Your Reply
                        </h3>
                        <ReplyForm threadId={thread.id} />
                    </div>
                ) : (
                    <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100">
                        <p className="mb-4 text-gray-700">
                            <strong>Want to join the discussion?</strong> Log in to post a reply.
                        </p>
                        <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium inline-block">Log In</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
