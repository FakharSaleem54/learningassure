'use client'

import { useState, useEffect } from 'react'
import { getUserNotifications, markNotificationAsRead } from '@/actions/notification-actions'

type Notification = {
    id: string
    message: string
    type: string
    read: boolean
    createdAt: Date
    link?: string | null
}

export default function NotificationList() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        loadNotifications()
        // Poll for notifications every minute
        const interval = setInterval(loadNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const loadNotifications = async () => {
        const data = await getUserNotifications()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.read).length)
    }

    const handleMarkRead = async (id: string, link?: string | null) => {
        await markNotificationAsRead(id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        if (link) {
            window.location.href = link
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Notifications"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-xs text-primary font-medium">{unreadCount} new</span>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleMarkRead(n.id, n.link)}
                                            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${n.read ? 'bg-white' : 'bg-blue-50/50'
                                                }`}
                                        >
                                            <p className={`text-sm mb-1 ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                {n.message}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
