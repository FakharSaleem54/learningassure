'use client'

import { addLesson, updateLesson, deleteLesson } from '@/app/actions/course'
import IndexLectureButton from './IndexLectureButton'
import LectureStatusBadge from './LectureStatusBadge'
import { useState } from 'react'
import { Trash2, FileText, Upload, Plus, X, Video, Link as LinkIcon, Edit2, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LessonManager({ module }: { module: any }) {
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState(false)

    const handleDeleteResource = async (resourceId: string) => {
        const { deleteResource } = await import('@/app/actions/resource')
        await deleteResource(resourceId)
    }

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return
        await deleteLesson(lessonId)
    }

    const handleVideoUpload = async (file: File, courseId: string, lessonId: string): Promise<string | null> => {
        setUploading(true)
        setUploadProgress(0)
        setUploadError(null)
        setUploadSuccess(false)

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const filePath = `courses/${courseId}/${lessonId}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(filePath, file, {
                    upsert: true,
                    // onUploadProgress: (progress) => { // Supabase V2 JS might not expose this easily in upload method directly similar to axios, checking docs... usually handled via XHR if manual or just await.
                    // Actually, modern supabase-js upload doesn't have a reliable progress callback in the simpler methods without TUS or custom fetch.
                    // For now, we'll confirm start/end.
                    // }
                })

            if (uploadError) throw uploadError

            setUploadSuccess(true)
            return filePath
        } catch (error: any) {
            console.error('Upload failed:', error)
            setUploadError(error.message || 'Upload failed')
            return null
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b border-border pb-2 flex items-center gap-2">
                Lessons in: <span className="text-primary">{module.title}</span>
            </h3>

            <div className="flex flex-col gap-4 mb-8">
                {module.lessons.map((lesson: any) => (
                    <div key={lesson.id} className="border border-border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors">
                        <div className={`flex justify-between items-center ${editingLessonId === lesson.id ? 'mb-4' : ''}`}>
                            <span className="font-semibold flex items-center gap-2 text-foreground">
                                <Video size={16} className="text-muted-foreground" />
                                {lesson.title}
                            </span>
                            <div className="flex gap-2 items-center">
                                <LectureStatusBadge
                                    lessonId={lesson.id}
                                    initialStatus={lesson.transcriptionJob?.status}
                                    hasVideo={!!lesson.videoUrl}
                                />
                                <IndexLectureButton
                                    courseId={module.courseId}
                                    lectureId={lesson.id}
                                    hasContent={!!lesson.content && lesson.content.trim().length > 0}
                                />
                                <button
                                    onClick={() => {
                                        setEditingLessonId(editingLessonId === lesson.id ? null : lesson.id)
                                        setUploadError(null)
                                        setUploadSuccess(false)
                                    }}
                                    className={`btn btn-sm ${editingLessonId === lesson.id ? 'btn-secondary' : 'btn-outline'} text-xs px-3 py-1.5 h-auto flex items-center gap-1.5`}
                                >
                                    {editingLessonId === lesson.id ? (
                                        <>
                                            <X size={14} /> Close
                                        </>
                                    ) : (
                                        <>
                                            <Edit2 size={14} /> Edit Content
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10 p-2 h-auto rounded-md transition-colors"
                                    title="Delete Lesson"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {editingLessonId === lesson.id && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);

                                        const videoFile = formData.get('videoFile') as File;
                                        let videoPath = null;

                                        if (videoFile && videoFile.size > 0) {
                                            if (videoFile.size > 2 * 1024 * 1024 * 1024) { // 2GB limit check client side
                                                alert("File too large (Max 2GB)");
                                                return;
                                            }
                                            videoPath = await handleVideoUpload(videoFile, module.courseId, lesson.id);
                                            if (!videoPath) return; // Stop if upload failed

                                            // Append the path to formData so server knows
                                            formData.set('videoPath', videoPath);
                                        }

                                        // We don't send the file to server action anymore if uploaded to supabase
                                        formData.delete('videoFile');

                                        await updateLesson(lesson.id, formData);
                                        setEditingLessonId(null);
                                    }}
                                    className="flex flex-col gap-6 mt-4 border-t border-dashed border-border pt-6"
                                >
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Video Source</label>
                                        <div className="flex gap-4 items-start flex-wrap">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-xs text-muted-foreground mb-1.5 block">Upload Video (Max 2GB)</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        name="videoFile"
                                                        accept="video/*"
                                                        disabled={uploading}
                                                        className="w-full text-sm p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                                                    />
                                                </div>
                                                {uploading && (
                                                    <div className="text-xs text-blue-500 mt-2 flex items-center gap-1.5">
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Uploading video directly to secure storage...
                                                    </div>
                                                )}
                                                {uploadSuccess && (
                                                    <div className="text-xs text-green-600 mt-2 flex items-center gap-1.5">
                                                        <CheckCircle2 size={12} />
                                                        Upload complete! Saving changes...
                                                    </div>
                                                )}
                                                {uploadError && (
                                                    <p className="text-xs text-red-500 mt-2">{uploadError}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center pt-8 text-sm font-medium text-muted-foreground">OR</div>
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-xs text-muted-foreground mb-1.5 block">External URL (YouTube/Vimeo)</label>
                                                <div className="relative">
                                                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                    <input
                                                        name="videoUrl"
                                                        defaultValue={lesson.videoUrl && lesson.videoUrl.startsWith('http') ? lesson.videoUrl : ''}
                                                        placeholder="https://youtube.com/..."
                                                        className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {lesson.videoUrl && (
                                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 bg-green-50 p-2 rounded w-fit border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
                                                <Video size={12} />
                                                Current: <span className="font-medium truncate max-w-[300px]">{lesson.videoUrl}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">Description</label>
                                        <input
                                            name="description"
                                            defaultValue={lesson.description || ''}
                                            className="w-full p-2 mb-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                            placeholder="Brief description for the lesson card..."
                                        />
                                        <label className="block mb-2 text-sm font-medium">Content / Notes</label>
                                        <textarea
                                            name="content"
                                            defaultValue={lesson.content || ''}
                                            rows={5}
                                            className="w-full p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm leading-relaxed"
                                            placeholder="Add lecture notes, summary or instructions..."
                                        />
                                    </div>

                                    {lesson.transcript && (
                                        <div className="bg-muted/30 p-4 rounded-md border border-border">
                                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <span>📝</span> Auto-Generated Transcript
                                            </h4>
                                            <div className="text-xs text-muted-foreground max-h-[200px] overflow-y-auto bg-background p-3 rounded border border-border leading-relaxed">
                                                {lesson.transcript.content ? (
                                                    lesson.transcript.content.split('\n').map((line: string, i: number) => (
                                                        <p key={i} className="mb-2 last:mb-0">{line}</p>
                                                    ))
                                                ) : (
                                                    <p className="italic">Transcript is empty or processing.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-right mt-6 border-t border-border pt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-sm px-4"
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Uploading...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>

                                {/* Resources Section */}
                                <div className="border-t border-dashed border-border pt-6 mt-6">
                                    <label className="block mb-3 text-sm font-medium flex items-center gap-2">
                                        <FileText size={16} className="text-primary" />
                                        Attached Resources (PDFs)
                                    </label>

                                    {/* List Existing Resources */}
                                    {lesson.resources && lesson.resources.length > 0 && (
                                        <div className="flex flex-col gap-2 mb-4">
                                            {lesson.resources.map((resource: any) => (
                                                <div key={resource.id} className="flex alignItems-center justify-between p-3 bg-muted/30 rounded-md border border-border hover:border-primary/30 transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <span className="text-sm font-medium truncate text-foreground">{resource.title || resource.fileName}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteResource(resource.id)}
                                                        className="btn btn-ghost btn-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remove Resource"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload New Resource */}
                                    <form action={async (formData) => {
                                        try {
                                            const { createResource } = await import('@/app/actions/resource')
                                            await createResource(lesson.id, formData)
                                        } catch (error) {
                                            console.error('Upload failed:', error)
                                            alert(`Failed to upload resource: ${(error as Error).message}`)
                                        }
                                    }} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                name="title"
                                                placeholder="Resource Title (optional)"
                                                className="w-full p-2 rounded-md border border-input mb-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            />
                                            <input
                                                type="file"
                                                name="file"
                                                accept=".pdf"
                                                required
                                                className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                                            />
                                        </div>
                                        <button className="btn btn-outline btn-sm h-fit gap-1.5 whitespace-nowrap">
                                            <Upload size={14} />
                                            Upload PDF
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {module.lessons.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/10">
                        <Video size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground italic text-sm">No lessons yet.</p>
                        <p className="text-xs text-muted-foreground/70">Add your first lesson below to get started.</p>
                    </div>
                )}
            </div>

            <form action={addLesson.bind(null, module.id)} className="flex gap-3 mt-4 border-t-2 border-border pt-6">
                <input
                    name="title"
                    placeholder="New Lesson Title"
                    required
                    className="flex-1 p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button type="submit" className="btn btn-primary flex items-center gap-2 px-6">
                    <Plus size={18} />
                    Add Lesson
                </button>
            </form>
        </div>
    )
}
