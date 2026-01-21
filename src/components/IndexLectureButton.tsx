'use client';

import { useState } from 'react';
import { indexLectureAction } from '@/actions/ai-actions';
import { Loader2, Database, AlertCircle } from 'lucide-react';

export default function IndexLectureButton({ courseId, lectureId, hasContent }: { courseId: string, lectureId: string, hasContent: boolean }) {
    const [isIndexing, setIsIndexing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleIndex = async () => {
        if (!hasContent) {
            setStatus('error');
            setErrorMessage('Please add text content to this lecture first.');
            return;
        }

        setIsIndexing(true);
        setStatus('idle');
        setErrorMessage('');
        try {
            const result = await indexLectureAction(courseId, lectureId);
            if (result.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Unknown error');
                console.error(result.error);
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err?.message || 'Unexpected error occurred');
        } finally {
            setIsIndexing(false);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <button
                onClick={handleIndex}
                disabled={isIndexing || !hasContent}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!hasContent
                    ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                    } disabled:opacity-50`}
                title={!hasContent ? "Add text content/notes to enable AI indexing" : "Index this lecture for AI Chat"}
            >
                {isIndexing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                {isIndexing ? 'Indexing...' : 'Index for AI'}
            </button>
            {!hasContent && (
                <span className="text-[10px] text-amber-600 flex items-center gap-1" title="AI Chat needs text content to work">
                    <AlertCircle size={10} /> Needs Content
                </span>
            )}
            {status === 'success' && <span className="text-xs text-green-600">Indexed!</span>}
            {status === 'error' && (
                <span className="text-xs text-red-600" title={errorMessage}>
                    {errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage || 'Failed'}
                </span>
            )}
        </div>
    );
}
