"use client";

import Link from "next/link";
import { MessageSquare, ArrowUp, Eye, CheckCircle, Clock } from "lucide-react";

interface ThreadCardProps {
    thread: {
        id: string;
        title: string;
        content: string;
        upvotes: number;
        viewCount: number;
        isResolved: boolean;
        createdAt: Date;
        author: { name: string | null; id: string };
        course?: { title: string } | null;
        tags?: string | null;
        _count: { replies: number };
    };
}

export default function ThreadCard({ thread }: ThreadCardProps) {
    const timeAgo = getTimeAgo(thread.createdAt);

    return (
        <Link
            href={`/community/${thread.id}`}
            className={`block p-6 bg-white rounded-xl shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 no-underline group ${thread.isResolved ? 'border-green-200 bg-green-50/10' : 'border-gray-200 hover:border-blue-200'
                }`}
        >
            <div className="flex gap-4 md:gap-6">
                {/* Vote Count */}
                <div className="flex flex-col items-center min-w-[50px] p-2 bg-gray-50 rounded-lg text-gray-700 h-fit">
                    <ArrowUp size={18} className={thread.upvotes > 0 ? 'text-primary' : 'text-gray-400'} />
                    <span className="font-bold text-lg">{thread.upvotes}</span>
                    <span className="text-xs text-gray-500">votes</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {thread.isResolved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle size={12} /> Resolved
                            </span>
                        )}
                        {thread.course && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {thread.course.title}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {thread.title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                        {thread.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                            <MessageSquare size={14} /> {thread._count.replies} replies
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye size={14} /> {thread.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={14} /> {timeAgo}
                        </span>
                        <span>by <span className="text-gray-600">{thread.author.name || 'Anonymous'}</span></span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
}
