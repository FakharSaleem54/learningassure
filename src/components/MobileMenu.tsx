'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LogIn, UserPlus, LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavItem {
    label: string;
    href: string;
}

interface MobileMenuProps {
    navItems: NavItem[];
    user: {
        name?: string | null;
        email?: string | null;
        role?: string;
    } | null;
}

export default function MobileMenu({ navItems, user }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Open menu"
            >
                <Menu size={28} />
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu Panel */}
            <div className={`fixed inset-y-0 right-0 w-[80%] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <span className="font-bold text-lg text-gray-800">Menu</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* User Profile Section (if logged in) */}
                    {user && (
                        <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-primary/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md">
                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{user.name || 'User'}</p>
                                    <p className="text-sm text-gray-500 truncate max-w-[180px]">{user.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/profile"
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
                                >
                                    <User size={16} /> Profile
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
                                >
                                    <LayoutDashboard size={16} /> Dashboard
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-4 px-2">
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 rounded-xl transition-all ${pathname === item.href
                                                ? 'bg-primary/10 text-primary font-bold'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        {user ? (
                            <form action="/api/auth/signout" method="POST">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
                                >
                                    <LogOut size={20} /> Sign Out
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <Link
                                    href="/login"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl font-bold transition-colors"
                                >
                                    <LogIn size={20} /> Log In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-primary hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                                >
                                    <UserPlus size={20} /> Sign Up Free
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
