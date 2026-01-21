"use client";

import React from 'react';
import { useGamification } from '@/context/GamificationContext';
import { getLevelProgress } from '@/lib/gamification/gamification';
import { Trophy } from 'lucide-react';

export default function GamificationStats() {
    const { state } = useGamification();
    const progress = getLevelProgress(state.points);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                        <Trophy className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                        Lvl {state.level === 'Beginner' ? 1 : state.level === 'Explorer' ? 2 : state.level === 'Achiever' ? 3 : 4}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-xl text-gray-900">{state.level}</h3>
                    <p className="text-sm text-gray-500">Keep learning to level up!</p>
                </div>
            </div>

            <div className="flex-1 w-full md:max-w-md">
                <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-gray-600">Level Progress</span>
                    <span className="text-blue-600">{state.points} XP</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
