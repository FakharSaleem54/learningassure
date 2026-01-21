"use client";

import { useState } from "react";
import { Bell, Send, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function NotificationsPage() {
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: 'Maintenance Window', message: 'System maintenance scheduled for Sunday 2 AM.', audience: 'All', date: '2025-12-10' },
        { id: 2, title: 'New Course Guidelines', message: 'Please review the updated course creation guidelines.', audience: 'Instructors', date: '2025-12-08' },
    ]);

    const [alerts] = useState([
        { id: 1, type: 'warning', message: '3 New Courses pending approval', date: '1 hour ago' },
        { id: 2, type: 'info', message: 'User registration spike detected', date: '5 hours ago' },
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
        const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
        const audience = (form.elements.namedItem('audience') as HTMLSelectElement).value;

        const newAnnouncement = {
            id: Date.now(),
            title,
            message,
            audience,
            date: new Date().toISOString().split('T')[0],
        };

        setAnnouncements([newAnnouncement, ...announcements]);
        form.reset();
        alert("Announcement Sent!");
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
                <p className="text-gray-500">Manage announcements and view system alerts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Send Announcement Form */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Send size={20} className="text-blue-600" />
                            Send Announcement
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input required name="title" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Announcement Title" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea required name="message" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Write your message here..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                                <select name="audience" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="All">All Users</option>
                                    <option value="Learners">Learners Only</option>
                                    <option value="Instructors">Instructors Only</option>
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                    Send Announcement
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* History */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Bell size={20} className="text-gray-600" />
                            History
                        </h3>
                        <div className="space-y-4">
                            {announcements.map((item) => (
                                <div key={item.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        <span className="text-xs text-gray-500">{item.date}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{item.message}</p>
                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                        To: {item.audience}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* System Alerts Sidebar */}
                <div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">System Alerts</h3>
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <div key={alert.id} className={`p-4 rounded-lg flex items-start gap-3 ${alert.type === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                                    }`}>
                                    {alert.type === 'warning' ? <AlertTriangle size={20} className="shrink-0" /> : <Info size={20} className="shrink-0" />}
                                    <div>
                                        <p className="text-sm font-medium">{alert.message}</p>
                                        <p className="text-xs opacity-70 mt-1">{alert.date}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="p-4 rounded-lg bg-green-50 text-green-800 flex items-start gap-3">
                                <CheckCircle size={20} className="shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">System operational</p>
                                    <p className="text-xs opacity-70 mt-1">Uptime: 99.9%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
