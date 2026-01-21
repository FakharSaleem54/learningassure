"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    BarChart,
    Bell,
    Settings,
    LogOut
} from "lucide-react";
import { logout } from "@/app/actions/auth";

const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Reports", href: "/admin/reports", icon: BarChart },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
    role?: string;
}

export default function AdminSidebar({ role }: AdminSidebarProps) {
    const pathname = usePathname();

    const filteredNavItems = navItems.filter(item => {
        if (item.label === "User Management") {
            return role === 'ADMIN';
        }
        return true;
    });

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 overflow-y-auto z-50 transition-all duration-300">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    LMS Admin
                </h1>
                {role && (
                    <div className="mt-2 text-xs font-medium px-2 py-1 bg-gray-800 rounded-full inline-block text-gray-400 border border-gray-700">
                        {role} VIEW
                    </div>
                )}
            </div>

            <nav className="p-4 space-y-2">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? "bg-blue-600/20 text-blue-400 font-medium"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                }`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
