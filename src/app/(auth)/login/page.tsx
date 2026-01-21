'use client'

import { useActionState } from 'react'
import { login, type FormState } from '@/app/actions/auth'
import Link from 'next/link'

const initialState: FormState = {
    message: '',
    errors: undefined,
}

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-sm text-gray-500 mt-2">Please sign in to your account</p>
                </div>

                <form action={action} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}"
                            title="Please enter a valid email address (e.g., user@domain.com)"
                            placeholder="you@example.com"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 bg-white"
                        />
                        {state.errors?.email && <p className="text-sm text-red-500 mt-1">{state.errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 bg-white"
                        />
                        {state.errors?.password && <p className="text-sm text-red-500 mt-1">{state.errors.password}</p>}
                    </div>

                    {state.message && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{state.message}</p>}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account? <Link href="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    )
}
