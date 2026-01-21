"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from "recharts";

const dataUserGrowth = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 500 },
    { name: 'Mar', users: 750 },
    { name: 'Apr', users: 1100 },
    { name: 'May', users: 1350 },
    { name: 'Jun', users: 1600 },
];

const dataCoursePopularity = [
    { name: 'React', students: 1200 },
    { name: 'Node.js', students: 900 },
    { name: 'Python', students: 1500 },
    { name: 'Design', students: 600 },
    { name: 'Marketing', students: 400 },
];

const dataCompletion = [
    { name: 'Completed', value: 450 },
    { name: 'In Progress', value: 1200 },
    { name: 'Dropped', value: 100 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-500">System-wide performance metrics and trends.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataUserGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip />
                                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Course Popularity Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Most Popular Categories</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataCoursePopularity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip />
                                <Bar dataKey="students" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Completion Rates */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Course Completion Rates</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataCompletion}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dataCompletion.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Certificate Statistics (Mock) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Certificate Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600">1,245</p>
                            <p className="text-sm text-gray-500">Issued This Month</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-3xl font-bold text-green-600">12,504</p>
                            <p className="text-sm text-gray-500">Total Issued</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
