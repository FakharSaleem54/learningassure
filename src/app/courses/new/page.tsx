'use client'

import { createCourse, FormState } from '@/app/actions/course'
import { useActionState } from 'react' // Next.js 14/15 hook
import Link from 'next/link'

const CATEGORIES = [
    'Web Development',
    'Data Science',
    'Design',
    'Marketing',
    'Business',
    'Personal Development'
]

const initialState: FormState = {
    message: '',
    errors: {}
}

export default function NewCoursePage() {
    // @ts-ignore - types for useActionState can be finicky in some next versions
    const [state, formAction] = useActionState(createCourse, initialState)

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4">
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="text-sm text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1 mb-4"
                >
                    ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Create New Course</h1>
                <p className="text-slate-500 mt-2">
                    Start creating your new course by filling out the details below.
                </p>
            </div>

            <form action={formAction} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {state.message && (
                    <div className={`p-4 rounded-lg text-sm border ${state.errors
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-green-50 text-green-600 border-green-100'
                        }`}>
                        {state.message}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Course Title</label>
                    <input
                        name="title"
                        required
                        minLength={5}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        placeholder="e.g. Advanced React Patterns"
                    />
                    {state.errors?.title && (
                        <p className="text-sm text-red-500 mt-1">{state.errors.title[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Category</label>
                    <div className="relative">
                        <select
                            name="category"
                            required
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none"
                        >
                            <option value="">Select a category...</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                    {state.errors?.category && (
                        <p className="text-sm text-red-500 mt-1">{state.errors.category[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Description</label>
                    <textarea
                        name="description"
                        required
                        minLength={10}
                        rows={4}
                        className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                        placeholder="What will students learn in this course?"
                    />
                    {state.errors?.description && (
                        <p className="text-sm text-red-500 mt-1">{state.errors.description[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Price ($)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue="0"
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white pl-7 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        />
                    </div>
                    {state.errors?.price && (
                        <p className="text-sm text-red-500 mt-1">{state.errors.price[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">Course Thumbnail</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                </svg>
                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (MAX. 1280x720px)</p>
                            </div>
                            <input name="thumbnail" type="file" className="hidden" accept="image/*" />
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                        Create Course
                    </button>
                    <p className="text-center mt-3 text-xs text-slate-500">
                        You can add modules, lessons, and quizzes after creating the course shell.
                    </p>
                </div>
            </form>
        </div>
    )
}
