"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createUser, updateUser } from "@/app/actions/admin";

interface UserFormProps {
    user?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserForm({ user, isOpen, onClose }: UserFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError("");

        let result;
        if (user) {
            formData.append("userId", user.id);
            result = await updateUser(formData);
        } else {
            result = await createUser(formData);
        }

        setIsLoading(false);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || "An error occurred");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {user ? "Edit User" : "Add New User"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            defaultValue={user?.name || ""}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue={user?.email || ""}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passsword</label>
                        <input
                            name="password"
                            type="password"
                            placeholder={user ? "Leave blank to keep current" : "Set password"}
                            required={!user}
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            name="role"
                            defaultValue={user?.role || "LEARNER"}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="LEARNER">Learner</option>
                            <option value="INSTRUCTOR">Instructor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
                        >
                            {isLoading ? "Saving..." : "Save User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
