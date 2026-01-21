"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import UserForm from "./UserForm";

export default function AddUserButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Plus size={20} />
                <span>Add User</span>
            </button>

            <UserForm
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
