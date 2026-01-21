"use client";

import React from 'react';

interface PointsPopupProps {
    points: number;
    message: string;
    onClose: () => void;
}

export default function PointsPopup({ points, message, onClose }: PointsPopupProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
            <div className="bg-white border-l-4 border-orange-500 shadow-xl rounded-lg p-4 flex items-center pr-8 relative overflow-hidden">
                <div className="flex-shrink-0 bg-orange-100 rounded-full p-2 mr-3">
                    <span className="text-xl">🎉</span>
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-lg">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-1 right-2 text-gray-400 hover:text-gray-600"
                >
                    ×
                </button>
                {/* Progress bar animation for dismissal */}
                <div className="absolute bottom-0 left-0 h-1 bg-orange-500 animate-shrink-width w-full"></div>
            </div>
        </div>
    );
}
