"use client";

import { Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-500">Configure general platform options and course categories.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">General Configuration</h3>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                            <input type="text" defaultValue="Learning Assure" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                            <input type="email" defaultValue="support@learningassure.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-gray-700">Allow New Registrations</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="pt-4">
                            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Categories Manager */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Course Categories</h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="text" placeholder="New Category Name" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Add</button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {['Technology', 'Business', 'Design', 'Marketing', 'Photography', 'Health', 'Music'].map((cat) => (
                                <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">{cat}</span>
                                    <button className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Note: Deleting a category will set associated courses to "Uncategorized".
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
