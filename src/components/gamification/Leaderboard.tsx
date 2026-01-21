"use client";

import React from 'react';
import { useGamification } from '@/context/GamificationContext';
import { GamificationStorage } from '@/lib/gamification/gamification-storage';

export default function Leaderboard() {
    const { state } = useGamification();
    const leaderboard = GamificationStorage.getLeaderboard();

    // Insert current user into leaderboard for demo purposes if not present (simple hack for demo)
    // In a real app, this would be fetched from backend
    const currentUser = { id: 999, name: "You", points: state.points, level: state.level };

    // Combine and sort
    const allUsers = [...leaderboard, currentUser].sort((a, b) => b.points - a.points).slice(0, 10);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900">Top Learners</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">Rank</th>
                            <th className="px-6 py-3 font-medium">Learner</th>
                            <th className="px-6 py-3 font-medium">Level</th>
                            <th className="px-6 py-3 font-medium text-right">XP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allUsers.map((user, index) => {
                            const isMe = user.id === 999;
                            const rank = index + 1;
                            let rankBadge = null;

                            if (rank === 1) rankBadge = "🥇";
                            else if (rank === 2) rankBadge = "🥈";
                            else if (rank === 3) rankBadge = "🥉";
                            else rankBadge = <span className="text-gray-400 font-mono w-6 inline-block text-center">{rank}</span>;

                            return (
                                <tr key={index} className={isMe ? "bg-blue-50/50" : "hover:bg-gray-50"}>
                                    <td className="px-6 py-4 text-base">
                                        {rankBadge}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {user.name} {isMe && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {user.level}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                                        {user.points}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
