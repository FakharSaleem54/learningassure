"use client";

import Link from "next/link";
import { User } from "lucide-react";

interface AdminHeaderProps {
    user?: {
        name: string | null;
        email: string;
        role: string;
    };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
    const displayName = user?.name || 'Administrator';
    const displayEmail = user?.email || 'admin@lms.com';
    const initials = displayName[0]?.toUpperCase() || 'A';

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 bg-opacity-90 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <h2 className="text-gray-500 text-sm font-medium">
                    Admin Portal
                </h2>
            </div>

            <Link
                href="/admin/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                    {initials}
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{displayName}</p>
                    <p className="text-xs text-gray-500">{user?.role || 'ADMIN'}</p>
                </div>
                <User size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </Link>
        </header>
    );
}

