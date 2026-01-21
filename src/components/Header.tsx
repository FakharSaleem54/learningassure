import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import UserMenu from './UserMenu';
import NotificationList from '@/components/NotificationList';

// Navigation configuration with role-based visibility
const navItems = [
    { label: 'Home', href: '/', roles: ['GUEST', 'LEARNER', 'INSTRUCTOR', 'ADMIN'] },
    { label: 'Courses', href: '/courses', roles: ['GUEST', 'LEARNER', 'INSTRUCTOR', 'ADMIN'] },
    { label: 'My Learning', href: '/my-learning', roles: ['LEARNER'] },
    { label: 'Community', href: '/community', roles: ['GUEST', 'LEARNER', 'INSTRUCTOR', 'ADMIN'] },
    { label: 'Help', href: '/support', roles: ['GUEST', 'LEARNER', 'INSTRUCTOR', 'ADMIN'] },
    { label: 'Dashboard', href: '/dashboard', roles: ['LEARNER', 'INSTRUCTOR', 'ADMIN'] },
    { label: 'My Profile', href: '/profile', roles: ['LEARNER', 'INSTRUCTOR', 'ADMIN'] },
    { label: 'Create Course', href: '/courses/new', roles: ['INSTRUCTOR', 'ADMIN'] },
    { label: 'Admin Panel', href: '/admin', roles: ['ADMIN'] },
];

export default async function Header() {
    const session = await getSession();
    const userRole = session?.role || 'GUEST';

    // Fetch user name if logged in
    let userName: string | null = null;
    if (session) {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { name: true }
        });
        userName = user?.name || null;
    }

    // Filter navigation items based on user role
    const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));

    return (
        <header
            className="sticky top-0 z-50 py-2 md:py-3 shadow-lg relative"
            style={{
                background: 'linear-gradient(to right, #D4A84B 0%, #B8860B 25%, #4169E1 75%, #2563EB 100%)',
            }}
        >
            {/* Decorative Diagonal Lines - Wrapped in overflow-hidden to prevent spillover */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[0%] left-[2%] h-[200%] w-6 bg-white/20 -rotate-12 origin-top-left"></div>
                <div className="absolute -top-[50%] left-[5%] h-[200%] w-6 bg-white/10 -rotate-12 origin-top-left"></div>
            </div>

            <div className="container mx-auto px-4 h-full flex items-center justify-between relative z-10">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white drop-shadow-md">
                    <img src="/assets/images/logo.png" alt="Learning Assure" className="h-16 w-auto" />
                </Link>

                <nav className="hidden md:flex items-center">
                    <ul className="flex items-center gap-8">
                        {visibleNavItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="text-sm md:text-base font-semibold text-white hover:text-yellow-200 transition-colors drop-shadow-sm"
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-4">
                    {session ? (
                        <div className="flex items-center gap-4">
                            <NotificationList />
                            <UserMenu session={{ ...session, name: userName }} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-white border-2 border-white rounded-md hover:bg-white/20 transition-colors backdrop-blur-sm"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-2 text-sm font-medium text-blue-700 bg-white rounded-md hover:bg-yellow-100 transition-colors shadow-md font-semibold"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
