'use client'

import { useState } from 'react'
import { createMeetingRequest } from '@/actions/meeting-actions'
import { Video, X, Calendar, Clock, MessageSquare, Loader2 } from 'lucide-react'

interface LiveMeetingRequestModalProps {
    courseId: string
    instructorId: string
    lectureId?: string
    studentName: string
}

export default function LiveMeetingRequestModal({ courseId, instructorId, lectureId, studentName }: LiveMeetingRequestModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [objective, setObjective] = useState('')
    const [preferredTime, setPreferredTime] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMessage(null)

        const result = await createMeetingRequest(courseId, instructorId, objective, preferredTime, lectureId)

        if (result.success) {
            setMessage({ type: 'success', text: 'Meeting request sent successfully!' })
            setObjective('')
            setPreferredTime('')
            setTimeout(() => {
                setIsOpen(false)
                setMessage(null)
            }, 2000)
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to send request' })
        }
        setIsSubmitting(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-outline btn-sm flex items-center gap-2 text-accent border-accent hover:bg-accent/10 transition-colors"
            >
                <Video size={16} /> Request Live Meeting
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Video size={24} className="text-blue-600" />
                        Request Live Meeting
                    </h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        Request a 1:1 session with the instructor to discuss this lecture. Please provide details to help them prepare.
                    </p>

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <MessageSquare size={16} className="text-gray-400" />
                                Objective of the Meeting
                            </label>
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm resize-y text-gray-900 placeholder:text-gray-400"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Describe the purpose or query you want to discuss..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                Preferred Date & Time (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full p-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-900"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 justify-end mt-8 pt-5 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px] flex justify-center items-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Sending...
                                    </span>
                                ) : 'Send Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
