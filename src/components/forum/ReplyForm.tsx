"use client";

import { useState } from "react";
import { createReply } from "@/app/actions/forum";
import { Send } from "lucide-react";

interface ReplyFormProps {
    threadId: string;
    parentId?: string;
    onCancel?: () => void;
    placeholder?: string;
}

export default function ReplyForm({ threadId, parentId, onCancel, placeholder = "Write your reply..." }: ReplyFormProps) {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        // content, threadId, parentId are automatically included if inputs have 'name' attributes.
        // But we need to make sure 'content' and hidden fields are set.
        // Since we are using controlled state for content, we should set it explicitly or rely on the textarea having name="content".
        // The original code used manual append. Let's switch to using the form data from the event target, 
        // which includes the file input automatically.

        // Ensure manual overrides
        if (!formData.get('content')) formData.set('content', content);
        formData.set('threadId', threadId);
        if (parentId) formData.set('parentId', parentId);

        const result = await createReply(formData);

        if (result.success) {
            setContent("");
            if (onCancel) onCancel();
        } else {
            setError(result.error || 'Failed to post reply');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-3 text-sm border border-red-100 flex items-center gap-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}
            <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-y"
            />

            <div className="mt-2">
                <input
                    type="file"
                    name="files"
                    multiple
                    accept="image/*,video/*"
                    className="block w-full text-xs text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                    "
                />
            </div>

            <div className="flex gap-2 mt-2 justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <Send size={16} />
                    {isLoading ? 'Posting...' : 'Post Reply'}
                </button>
            </div>
        </form>
    );
}
