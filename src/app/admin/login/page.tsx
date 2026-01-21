"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function AdminLoginPage() {
    const [state, action, pending] = useActionState(login, undefined);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8 bg-gray-50 border-b border-gray-100 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="text-gray-500 mt-2">Sign in to access the control panel</p>
                </div>

                <form action={action} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}"
                            title="Please enter a valid email address (e.g., user@domain.com)"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="admin@lms.com"
                        />
                        {state?.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                        />
                        {state?.errors?.password && <p className="text-red-500 text-sm mt-1">{state.errors.password}</p>}
                    </div>

                    {state?.message && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {state.message}
                        </div>
                    )}

                    <button
                        disabled={pending}
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {pending ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                <div className="px-8 pb-8 text-center">
                    <p className="text-xs text-gray-500">Authorized personnel only.</p>
                </div>
            </div>
        </div>
    );
}
