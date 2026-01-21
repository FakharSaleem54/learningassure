'use client'

import { updateCourse, deleteCourse, FormState } from '@/app/actions/course'
import { useActionState } from 'react'
import { useState } from 'react'

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

export default function EditCourseForm({ course }: { course: any }) {
    // Bind courseId to the action
    const updateCourseWithId = updateCourse.bind(null, course.id)
    // @ts-ignore
    const [state, formAction] = useActionState(updateCourseWithId, initialState)
    const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

    return (
        <div className="bg-card p-8 rounded-xl border border-border flex flex-col gap-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-semibold border-b border-border pb-4 text-foreground">Course Settings</h2>

            {state.message && (
                <div className={`p-4 rounded-lg border text-sm font-medium ${state.errors
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                    {state.message}
                </div>
            )}

            <form action={formAction} className="flex flex-col gap-6">
                <div>
                    <label className="block mb-2 font-medium text-foreground">Course Title</label>
                    <input
                        name="title"
                        defaultValue={course.title}
                        required
                        minLength={5}
                        className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    {state.errors?.title && <p className="text-destructive text-sm mt-1">{state.errors.title[0]}</p>}
                </div>

                <div>
                    <label className="block mb-2 font-medium text-foreground">Category</label>
                    <select
                        name="category"
                        defaultValue={course.category || ''}
                        required
                        className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                        <option value="" disabled>Select a category...</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        {!CATEGORIES.includes(course.category) && course.category && (
                            <option value={course.category}>{course.category}</option>
                        )}
                    </select>
                    {state.errors?.category && <p className="text-destructive text-sm mt-1">{state.errors.category[0]}</p>}
                </div>

                <div>
                    <label className="block mb-2 font-medium text-foreground">Description</label>
                    <textarea
                        name="description"
                        defaultValue={course.description}
                        required
                        minLength={10}
                        rows={4}
                        className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-sans"
                    />
                    {state.errors?.description && <p className="text-destructive text-sm mt-1">{state.errors.description[0]}</p>}
                </div>

                <div>
                    <label className="block mb-2 font-medium text-foreground">Price ($)</label>
                    <input
                        name="price"
                        type="number"
                        defaultValue={course.price}
                        min="0"
                        step="0.01"
                        className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    {state.errors?.price && <p className="text-destructive text-sm mt-1">{state.errors.price[0]}</p>}
                </div>

                <div>
                    <label className="block mb-2 font-medium text-foreground">Thumbnail</label>
                    {course.thumbnail && (
                        <div className="mb-4 relative w-64 aspect-video rounded-lg overflow-hidden border border-border">
                            <img src={course.thumbnail} alt="Current thumbnail" className="object-cover w-full h-full" />
                        </div>
                    )}
                    <input
                        name="thumbnail"
                        type="file"
                        accept="image/*"
                        className="w-full p-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
            </form>

            <div className="border-t border-border pt-8 mt-4">
                <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">Once you delete a course, there is no going back. Please be certain.</p>

                {!isDeleteConfirming ? (
                    <button
                        onClick={() => setIsDeleteConfirming(true)}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                    >
                        Delete Course
                    </button>
                ) : (
                    <div className="flex gap-4 items-center">
                        <form action={async () => await deleteCourse(course.id)}>
                            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                                Confirm Delete
                            </button>
                        </form>
                        <button
                            onClick={() => setIsDeleteConfirming(false)}
                            className="text-muted-foreground hover:text-foreground text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
