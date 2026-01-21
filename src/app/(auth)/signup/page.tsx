'use client'

import { useActionState } from 'react'
import { signup, type FormState } from '@/app/actions/auth'
import Link from 'next/link'

const initialState: FormState = {
    message: '',
    errors: undefined,
}

export default function SignupPage() {
    const [state, action, isPending] = useActionState(signup, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-sm text-gray-500 mt-2">Join us to start learning</p>
                </div>

                <form action={action} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your Name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 bg-white"
                        />
                        {state.errors?.name && <p className="text-sm text-red-500 mt-1">{state.errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
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
                            placeholder="Min 6 characters"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 bg-white"
                        />
                        {state.errors?.password && <p className="text-sm text-red-500 mt-1">{state.errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                        <select
                            id="role"
                            name="role"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-colors text-gray-900"
                        >
                            <option value="LEARNER">Learner</option>
                            <option value="INSTRUCTOR">Instructor</option>
                        </select>
                    </div>

                    {state.message && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{state.message}</p>}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    )
}
