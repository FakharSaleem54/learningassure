'use client'

type MeetingRequest = {
    id: string
    instructor: { name: string | null }
    course: { title: string }
    objective: string
    status: string
    preferredTime: Date | null
    createdAt: Date
    lecture?: { title: string } | null
    meetingLink?: string | null
    zoomJoinUrl?: string | null
    notes?: string | null
}

export default function StudentMeetingDashboard({ requests }: { requests: MeetingRequest[] }) {
    if (requests.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-500">You haven't requested any meetings yet.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {requests.map(request => (
                <div key={request.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">Meeting with {request.instructor.name || 'Instructor'}</h4>
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
                        <p className="mb-2 text-gray-700"><strong>Your Objective:</strong> {request.objective}</p>
                    </div>

                    {request.status === 'APPROVED' && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-green-800 text-sm">
                            <h5 className="font-semibold text-base mb-2">Meeting Details</h5>
                            <p className="mb-2">
                                <span className="font-medium">Scheduled Time:</span> {request.preferredTime ? new Date(request.preferredTime).toLocaleString() : 'TBD'}
                            </p>
                            {request.meetingLink && (
                                <p className="mb-2">
                                    <span className="font-medium">Link:</span> <a href={request.meetingLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">{request.meetingLink}</a>
                                </p>
                            )}
                            {request.notes && (
                                <p>
                                    <span className="font-medium">Instructor Notes:</span> {request.notes}
                                </p>
                            )}
                        </div>
                    )}

                    {request.status === 'REJECTED' && request.notes && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800 text-sm">
                            <p>
                                <span className="font-medium">Reason:</span> {request.notes}
                            </p>
                        </div>
                    )}

                    {request.status === 'PENDING' && (
                        <div className="px-4 py-3 bg-blue-50/50 rounded-lg text-sm text-blue-600 italic border border-blue-50">
                            Waiting for instructor approval...
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
