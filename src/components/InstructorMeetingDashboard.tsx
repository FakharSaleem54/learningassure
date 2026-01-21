'use client'

import { useState } from 'react'
import { updateMeetingRequestStatus } from '@/actions/meeting-actions'

type MeetingRequest = {
    id: string
    student: { name: string | null }
    course: { title: string }
    objective: string
    status: string
    preferredTime: Date | null
    createdAt: Date
    lecture?: { title: string } | null
}

export default function InstructorMeetingDashboard({ requests }: { requests: MeetingRequest[] }) {
    const [activeRequests, setActiveRequests] = useState(requests)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [approvalOpen, setApprovalOpen] = useState<string | null>(null)

    // Approval Form State
    const [meetingLink, setMeetingLink] = useState('')
    const [confirmedTime, setConfirmedTime] = useState('')
    const [notes, setNotes] = useState('')

    const handleAction = async (requestId: string, status: string, data?: any) => {
        setProcessingId(requestId)
        const result = await updateMeetingRequestStatus(requestId, status, data)

        if (result.success) {
            // Optimistic update
            setActiveRequests(prev => prev.map(r =>
                r.id === requestId ? { ...r, status } : r
            ))
            setApprovalOpen(null)
            setMeetingLink('')
            setNotes('')
            setConfirmedTime('')
        } else {
            alert('Failed to update status')
        }
        setProcessingId(null)
    }

    const startApproval = (request: MeetingRequest) => {
        setApprovalOpen(request.id)
        if (request.preferredTime) {
            // Format for datetime-local: YYYY-MM-DDThh:mm
            setConfirmedTime(new Date(request.preferredTime).toISOString().slice(0, 16))
        }
    }

    if (activeRequests.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-500">No meeting requests found.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {activeRequests.map(request => (
                <div key={request.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{request.student.name || 'Unknown Student'}</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusClasses(request.status)}`}>
                                    {request.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Course:</span> {request.course.title}
                                {request.lecture && <span> • <span className="font-medium">Lecture:</span> {request.lecture.title}</span>}
                            </p>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                        <p className="mb-2 text-gray-700"><strong>Objective:</strong> {request.objective}</p>
                        {request.preferredTime && (
                            <p className="text-gray-600">
                                <strong>Preferred Time:</strong> {new Date(request.preferredTime).toLocaleString()}
                            </p>
                        )}
                    </div>

                    {request.status === 'PENDING' && (
                        <div>
                            {approvalOpen === request.id ? (
                                <div className="mt-4 p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                                    <h5 className="font-semibold text-gray-900 mb-4">Approve & Schedule Meeting</h5>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmed Time</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                value={confirmedTime}
                                                onChange={(e) => setConfirmedTime(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Zoom/Google Meet/etc)</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                value={meetingLink}
                                                onChange={(e) => setMeetingLink(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Student (Optional)</label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm min-h-[80px]"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                                            onClick={() => setApprovalOpen(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
                                            onClick={() => handleAction(request.id, 'APPROVED', { meetingLink, newTime: confirmedTime, notes })}
                                            disabled={!confirmedTime}
                                        >
                                            Confirm Approval
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3 mt-4">
                                    <button
                                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                        onClick={() => startApproval(request)}
                                        disabled={!!processingId}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                                        onClick={() => {
                                            if (confirm('Reject this request?')) {
                                                handleAction(request.id, 'REJECTED')
                                            }
                                        }}
                                        disabled={!!processingId}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {request.status === 'APPROVED' && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 flex items-center gap-2">
                            <span>✓</span> Scheduled for {request.preferredTime ? new Date(request.preferredTime).toLocaleString() : 'Confirmed Time'}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function getStatusClasses(status: string) {
    switch (status) {
        case 'APPROVED': return 'bg-green-100 text-green-800'
        case 'REJECTED': return 'bg-red-100 text-red-800'
        default: return 'bg-yellow-100 text-yellow-800' // Pending
    }
}
