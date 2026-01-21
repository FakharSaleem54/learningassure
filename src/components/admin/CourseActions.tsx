"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { updateCourseStatus } from "@/app/actions/admin";
import Link from "next/link";

interface CourseActionsProps {
    courseId: string;
    status: string;
}

export default function CourseActions({ courseId, status }: CourseActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to mark this course as ${newStatus}?`)) return;

        setIsLoading(true);
        await updateCourseStatus(courseId, newStatus);
        setIsLoading(false);
    };

    return (
        <div className="flex items-center gap-2 justify-end">
            <Link
                href={`/courses/${courseId}`}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Course"
            >
                <Eye size={18} />
            </Link>

            {status === 'PENDING' && (
                <>
                    <button
                        onClick={() => handleStatusChange('ACTIVE')}
                        disabled={isLoading}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                    >
                        <CheckCircle size={18} />
                    </button>
                    <button
                        onClick={() => handleStatusChange('REJECTED')}
                        disabled={isLoading}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject"
                    >
                        <XCircle size={18} />
                    </button>
                </>
            )}

            {status === 'REJECTED' && (
                <button
                    onClick={() => handleStatusChange('PENDING')}
                    disabled={isLoading}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset to Pending"
                >
                    <CheckCircle size={18} />
                </button>
            )}

            {status === 'ACTIVE' && (
                <button
                    onClick={() => handleStatusChange('REJECTED')}
                    disabled={isLoading}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Reject/Unpublish"
                >
                    <XCircle size={18} />
                </button>
            )}
        </div>
    );
}
