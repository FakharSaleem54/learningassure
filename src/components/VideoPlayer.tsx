'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VideoPlayerProps {
    url: string | null;
    title: string;
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getSignedUrl() {
            if (!url) return;

            // If it's already a full URL (YouTube, Vimeo, or external), use directly
            if (url.startsWith('http') || url.startsWith('blob:')) {
                setSignedUrl(url);
                return;
            }

            // For Supabase storage paths, generate a signed URL
            setLoading(true);
            setError(null);

            try {
                const supabase = createClient();

                // Clean the path - remove leading slash if present
                const cleanPath = url.startsWith('/') ? url.slice(1) : url;

                const { data, error: signError } = await supabase
                    .storage
                    .from('videos')
                    .createSignedUrl(cleanPath, 60 * 60); // 1 hour expiry

                if (signError) {
                    console.error('Error creating signed URL:', signError);
                    setError('Failed to load video');
                    return;
                }

                setSignedUrl(data.signedUrl);
            } catch (err) {
                console.error('Error fetching signed URL:', err);
                setError('Failed to load video');
            } finally {
                setLoading(false);
            }
        }

        getSignedUrl();
    }, [url]);

    if (!url) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No video available for this lesson</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Loading video...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-red-200">
                <div className="text-center text-red-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const videoUrl = signedUrl || url;

    // Detect video type and render appropriate player
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isVimeo = videoUrl.includes('vimeo.com');

    if (isYouTube) {
        // Extract YouTube video ID
        let videoId = '';
        if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
        }

        return (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    if (isVimeo) {
        // Extract Vimeo video ID
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || '';

        return (
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src={`https://player.vimeo.com/video/${videoId}`}
                    title={title}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    // Default: HTML5 video player for direct video URLs (including signed URLs)
    return (
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <video
                src={videoUrl}
                controls
                className="w-full h-full"
                title={title}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
