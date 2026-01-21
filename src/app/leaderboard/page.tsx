import React from 'react';
import Leaderboard from '@/components/gamification/Leaderboard';

export default function LeaderboardPage() {
    return (
        <div className="container p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
                <p className="text-gray-600">See how you stack up against other learners!</p>
            </div>

            <Leaderboard />
        </div>
    );
}
