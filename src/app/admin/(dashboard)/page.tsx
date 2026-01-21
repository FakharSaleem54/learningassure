"use client";

import { Users, GraduationCap, BookOpen, Clock } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
    { name: 'Jan', students: 400 },
    { name: 'Feb', students: 300 },
    { name: 'Mar', students: 200 },
    { name: 'Apr', students: 278 },
    { name: 'May', students: 189 },
    { name: 'Jun', students: 239 },
    { name: 'Jul', students: 349 },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Learners"
                    value="2,543"
                    icon={Users}
                    trend="+12.5%"
                    trendUp={true}
                />
                <StatsCard
                    label="Total Instructors"
                    value="45"
                    icon={GraduationCap}
                    trend="+2.4%"
                    trendUp={true}
                />
                <StatsCard
                    label="Active Courses"
                    value="128"
                    icon={BookOpen}
                    trend="+5.2%"
                    trendUp={true}
                />
                <StatsCard
                    label="Pending Approvals"
                    value="12"
                    icon={Clock}
                    trend="-2"
                    trendUp={false}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enrollment Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Enrollment Trends</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="students"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorStudents)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity / Popular Courses - Placeholder */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Popular Courses</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Advanced React Patterns</h4>
                                        <p className="text-xs text-gray-500">Steve Smith • 1.2k students</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-green-600">$49.99</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
