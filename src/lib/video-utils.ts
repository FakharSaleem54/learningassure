import { createClient } from './supabase/server'

/**
 * Generates a signed URL for a private video path.
 * @param path The path of the video in the storage bucket (e.g. "courses/123/lesson456.mp4")
 * @param expiresInSeconds Validity duration in seconds (default 1 hour)
 */
export async function getSignedVideoUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!path) return null

    // If it's already a full URL (public or external), return as is
    if (path.startsWith('http')) return path

    // Clean the path - remove leading slash if present ( Supabase Storage doesn't like them)
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .storage
            .from('videos')
            .createSignedUrl(cleanPath, expiresInSeconds)

        if (error) {
            console.error(`Error signing URL for path: "${path}"`, error)
            return null
        }

        return data.signedUrl
    } catch (err) {
        console.error('Failed to sign URL:', err)
        return null
    }
}
