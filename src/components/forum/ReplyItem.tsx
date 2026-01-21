"use client";

import { useState } from "react";
import { CheckCircle, Reply, Trash2, MoreVertical } from "lucide-react";
import VoteButtons from "./VoteButtons";
import ReplyForm from "./ReplyForm";
import { markAsAccepted, deleteReply } from "@/app/actions/forum";

interface ReplyItemProps {
    reply: {
        id: string;
        content: string;
        upvotes: number;
        isAccepted: boolean;
        createdAt: Date;
        attachments?: any; // JSONB
        author: { id: string; name: string | null };
        children?: ReplyItemProps["reply"][];
    };
    threadId: string;
    threadAuthorId: string;
    currentUserId?: string;
    userVote?: number;
    depth?: number;
}

export default function ReplyItem({ reply, threadId, threadAuthorId, currentUserId, userVote, depth = 0 }: ReplyItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = currentUserId === reply.author.id;
    const isThreadAuthor = currentUserId === threadAuthorId;
    const canDelete = isAuthor || currentUserId === threadAuthorId;

    const handleAccept = async () => {
        await markAsAccepted(reply.id);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this reply?")) return;
        setIsDeleting(true);
        await deleteReply(reply.id);
    };

    const timeAgo = getTimeAgo(reply.createdAt);

    return (
        <div className={`${depth > 0 ? "ml-8 md:ml-12 border-l-2 border-gray-100 pl-4" : ""}`}>
            <div
                className={`flex gap-4 p-4 md:p-6 mb-4 rounded-xl border transition-all ${reply.isAccepted
                    ? "bg-green-50/50 border-green-200"
                    : "bg-white border-gray-200"
                    } ${isDeleting ? "opacity-50" : "opacity-100"}`}
            >
                {/* Vote Buttons */}
                <div className="shrink-0">
                    <VoteButtons
                        itemId={reply.id}
                        itemType="reply"
                        currentVotes={reply.upvotes}
                        userVote={userVote}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        {reply.isAccepted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-sm">
                                <CheckCircle size={12} strokeWidth={3} /> Accepted Answer
                            </span>
                        )}
                        <span className="font-semibold text-gray-900">{reply.author.name || "Anonymous"}</span>
                        <span className="text-xs text-gray-400">{timeAgo}</span>
                    </div>

                    {/* Body */}
                    <div className="prose max-w-none text-gray-700 mb-4 whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                        {reply.content}
                    </div>

                    {/* Attachments */}
                    {reply.attachments && Array.isArray(reply.attachments) && (
                        <div className="mb-4 grid grid-cols-1 gap-4 max-w-lg">
                            {(reply.attachments as any[]).map((file, idx) => (
                                <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                                    {file.type === 'image' ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-full h-auto object-cover max-h-[300px]"
                                        />
                                    ) : file.type === 'video' ? (
                                        <video
                                            src={file.url}
                                            controls
                                            className="w-full h-auto max-h-[300px]"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-50 flex items-center gap-2">
                                            <span className="text-gray-500 text-xs">Attachment:</span>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">
                                                {file.name}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 mt-3">
                        {currentUserId && (
                            <button
                                onClick={() => setShowReplyForm(!showReplyForm)}
                                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <Reply size={14} /> Reply
                            </button>
                        )}

                        {isThreadAuthor && !reply.isAccepted && (
                            <button
                                onClick={handleAccept}
                                className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                            >
                                <CheckCircle size={14} /> Accept Answer
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:cursor-not-allowed"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {showReplyForm && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                            <ReplyForm
                                threadId={threadId}
                                parentId={reply.id}
                                onCancel={() => setShowReplyForm(false)}
                                placeholder={`Reply to ${reply.author.name || "this comment"}...`}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {reply.children && reply.children.length > 0 && (
                <div className="mt-2">
                    {reply.children.map((child) => (
                        <ReplyItem
                            key={child.id}
                            reply={child}
                            threadId={threadId}
                            threadAuthorId={threadAuthorId}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
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
    return "just now";
}
