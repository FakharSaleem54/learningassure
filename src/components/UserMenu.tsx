'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

type UserSession = {
    userId: string
    role: string
    expiresAt: Date
    name?: string | null
}

export default function UserMenu({ session }: { session: UserSession }) {
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
    }

    const displayName = session.name || 'User'
    const initials = displayName.charAt(0).toUpperCase()

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {initials}
                </div>
                <div className="text-left hidden md:block">
                    <span className="block text-sm font-bold text-gray-900 leading-none mb-0.5">{displayName}</span>
                    <span className="block text-[10px] uppercase tracking-wide font-bold text-gray-500 leading-none">{session.role}</span>
                </div>
                <span className="text-xs text-gray-400 hidden md:block">▼</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                            <p className="text-sm font-medium text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-500">{session.role}</p>
                        </div>

                        <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Profile
                        </Link>
                        <div className="my-1 border-t border-gray-100"></div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                        >
                            Log Out
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
