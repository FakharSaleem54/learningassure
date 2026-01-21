"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/app/actions/profile";
import { User, Lock, Mail, Save, AlertCircle, CheckCircle } from "lucide-react";
import GamificationStats from "./gamification/GamificationStats";
import BadgeDisplay from "./gamification/BadgeDisplay";

interface PublicProfileFormsProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    };
}

export default function PublicProfileForms({ user }: PublicProfileFormsProps) {
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
            const form = document.getElementById('password-form') as HTMLFormElement;
            form?.reset();
        } else {
            setPasswordMessage({ type: 'error', text: result.error || 'Failed to change password' });
        }
    };

    const roleColors: Record<string, { bg: string, text: string, gradient: string }> = {
        LEARNER: { bg: 'bg-green-100', text: 'text-green-700', gradient: 'from-green-500 to-emerald-600' },
        INSTRUCTOR: { bg: 'bg-blue-100', text: 'text-blue-700', gradient: 'from-blue-500 to-indigo-600' },
        ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', gradient: 'from-purple-500 to-indigo-600' },
    };

    const colors = roleColors[user.role] || roleColors.LEARNER;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Profile Header Card */}
            <div
                className={`bg-gradient-to-br ${colors.gradient} rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden`}
            >
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30 backdrop-blur-sm">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">
                            {user.name || 'Set Your Name'}
                        </h1>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start opacity-90">
                            <span className="flex items-center gap-2">
                                <Mail size={16} /> {user.email}
                            </span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gamification Stats */}
            <div className="mb-8">
                <GamificationStats />
                <BadgeDisplay />
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                        <div className="p-2 bg-blue-100 rounded-lg text-primary">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Profile Information</h2>
                            <p className="text-xs text-muted-foreground">Update your personal details</p>
                        </div>
                    </div>
                    <form action={handleProfileSubmit} className="p-6 flex flex-col gap-4">
                        {profileMessage && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${profileMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {profileMessage.text}
                            </div>
                        )}
                        <div>
                            <label className="block mb-1.5 font-medium text-sm text-foreground">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                defaultValue={user.name || ''}
                                placeholder="Enter your name"
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 font-medium text-sm text-foreground">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                defaultValue={user.email}
                                placeholder="Enter your email"
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isProfileLoading}
                            className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2"
                        >
                            <Save size={18} />
                            {isProfileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">Change Password</h2>
                            <p className="text-xs text-muted-foreground">Update your security credentials</p>
                        </div>
                    </div>
                    <form id="password-form" action={handlePasswordSubmit} className="p-6 flex flex-col gap-4">
                        {passwordMessage && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${passwordMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {passwordMessage.text}
                            </div>
                        )}
                        <div>
                            <label className="block mb-1.5 font-medium text-sm text-foreground">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                placeholder="Enter current password"
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 font-medium text-sm text-foreground">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="Enter new password"
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 font-medium text-sm text-foreground">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm new password"
                                className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPasswordLoading}
                            className="bg-orange-600 text-white hover:bg-orange-700 btn w-full flex items-center justify-center gap-2 mt-2"
                        >
                            <Lock size={18} />
                            {isPasswordLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
