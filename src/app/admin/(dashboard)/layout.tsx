import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from '@/lib/prisma';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // If no session or not admin, redirect to admin login
    if (!session || session.role !== 'ADMIN') {
        redirect('/admin/login')
    }

    // Fetch user details for the header
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, role: true }
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar role={session?.role} />
            <div className="pl-64">
                <AdminHeader user={user || undefined} />
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

