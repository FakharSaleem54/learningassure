'use client';

interface VideoPlayerProps {
    url: string | null;
    title: string;
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
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

    // Detect video type and render appropriate player
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isVimeo = url.includes('vimeo.com');

    if (isYouTube) {
        // Extract YouTube video ID
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0] || '';
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
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0] || '';

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

    // Default: HTML5 video player for direct video URLs
    return (
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <video
                src={url}
                controls
                className="w-full h-full"
                title={title}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
