"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/app/actions/profile";
import { User, Lock, Mail, Save, AlertCircle, CheckCircle } from "lucide-react";

interface ProfileFormsProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    };
}

export default function ProfileForms({ user }: ProfileFormsProps) {
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const handleProfileSubmit = async (formData: FormData) => {
        setIsProfileLoading(true);
        setProfileMessage(null);
        const result = await updateProfile(formData);
        setIsProfileLoading(false);
        if (result.success) {
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } else {
            setProfileMessage({ type: 'error', text: result.error || 'Failed to update profile' });
        }
    };

    const handlePasswordSubmit = async (formData: FormData) => {
        setIsPasswordLoading(true);
        setPasswordMessage(null);
        const result = await changePassword(formData);
        setIsPasswordLoading(false);
        if (result.success) {
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            // Clear form
            const form = document.getElementById('password-form') as HTMLFormElement;
            form?.reset();
        } else {
            setPasswordMessage({ type: 'error', text: result.error || 'Failed to change password' });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                            <p className="text-sm text-gray-500">Update your personal details</p>
                        </div>
                    </div>
                </div>
                <form action={handleProfileSubmit} className="p-6 space-y-4">
                    {profileMessage && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {profileMessage.text}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={user.name || ''}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                name="email"
                                defaultValue={user.email}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <input
                            type="text"
                            value={user.role}
                            disabled
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Contact a super admin to change your role</p>
                    </div>
                    <button
                        type="submit"
                        disabled={isProfileLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <Save size={18} />
                        {isProfileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Lock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                            <p className="text-sm text-gray-500">Update your security credentials</p>
                        </div>
                    </div>
                </div>
                <form id="password-form" action={handlePasswordSubmit} className="p-6 space-y-4">
                    {passwordMessage && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {passwordMessage.text}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="Enter current password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPasswordLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <Lock size={18} />
                        {isPasswordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
