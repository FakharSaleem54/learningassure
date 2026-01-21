"use client";

import { useState } from "react";
import { MoreVertical, Shield, Ban, CheckCircle, Edit, Trash2 } from "lucide-react";
import { toggleUserStatus, deleteUser } from "@/app/actions/admin";
import UserForm from "./UserForm";

interface UserActionsProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        status: string; // Ensure status is included
    };
}

export default function UserActions({ user }: UserActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleStatus = async () => {
        setIsLoading(true);
        await toggleUserStatus(user.id, user.status);
        setIsLoading(false);
        setIsOpen(false);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            setIsLoading(true);
            await deleteUser(user.id);
            setIsLoading(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <MoreVertical size={16} className="text-gray-500" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1 overflow-hidden" style={{ minWidth: '160px' }}>
                        <button
                            onClick={() => { setIsEditOpen(true); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                        >
                            <Edit size={16} />
                            <span>Edit Details</span>
                        </button>

                        <button
                            onClick={handleToggleStatus}
                            disabled={isLoading}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${user.status === 'ACTIVE' ? 'text-orange-600' : 'text-green-600'}`}
                        >
                            {user.status === 'ACTIVE' ? (
                                <>
                                    <Ban size={16} />
                                    <span>Suspend User</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    <span>Activate User</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-50 text-red-600 border-t border-gray-100"
                        >
                            <Trash2 size={16} />
                            <span>Delete User</span>
                        </button>
                    </div>
                </>
            )}

            <UserForm
                user={user}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />
        </div>
    );
}
