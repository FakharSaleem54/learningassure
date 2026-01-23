import { prisma } from '@/lib/prisma';
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ProfileForms from "@/components/admin/ProfileForms";
import { User, Shield, Calendar, Mail } from "lucide-react";

export default async function AdminProfilePage() {
    const session = await getSession();

    if (!session) {
        redirect('/admin/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        }
    });

    if (!user) {
        redirect('/admin/login');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500">Manage your account settings and preferences</p>
            </div>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{user.name || 'No Name Set'}</h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-blue-100">
                            <span className="flex items-center gap-1.5">
                                <Mail size={16} />
                                {user.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Shield size={16} />
                                {user.role}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={16} />
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                            {user.role} Account
                        </span>
                    </div>
                </div>
            </div>

            {/* Forms */}
            <ProfileForms user={user} />
        </div>
    );
}
