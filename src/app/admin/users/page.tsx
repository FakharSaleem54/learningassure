import { prisma } from '@/lib/prisma';
import UserActions from "@/components/admin/UserActions";
import AddUserButton from "@/components/admin/AddUserButton";
import Link from "next/link";
import { Search, Filter, ArrowUpDown } from "lucide-react";

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; role?: string; sort?: string }>; // Added sort to searchParams type
}) {
    const { q: query = "", role: roleFilter, sort = "createdAt" } = await searchParams; // Destructured sort with default

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { email: { contains: query } },
            ],
            role: roleFilter,
        },
        orderBy: {
            [sort === "name" ? "name" : "createdAt"]: "desc", // Dynamic orderBy based on sort param
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage learners, instructors, and admins.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto items-center"> {/* Added items-center */}
                    {/* Placeholder for Search - would need a client component to handle URL params */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                    </div>
                    <AddUserButton /> {/* Replaced Filter button with AddUserButton */}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">
                                <Link href="/admin/users?sort=name" className="flex items-center gap-1 hover:text-blue-600">
                                    User
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Role</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">
                                <Link href="/admin/users?sort=createdAt" className="flex items-center gap-1 hover:text-blue-600">
                                    Joined
                                    <ArrowUpDown size={14} />
                                </Link>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-blue-50/50 even:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {user.name?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{user.name || "No Name"}</h4>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'
                                            }`}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <UserActions user={user as any} /> {/* Updated UserActions prop */}
                                </td>
                            </tr>
                        ))}

                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
