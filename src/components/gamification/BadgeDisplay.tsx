"use client";

import React from 'react';
import { useGamification } from '@/context/GamificationContext';
import { BADGES } from '@/lib/gamification/gamification';
import { Sprout, GraduationCap, Brain, Rocket, Award, HelpCircle } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
    "Sprout": Sprout,
    "GraduationCap": GraduationCap,
    "Brain": Brain,
    "Rocket": Rocket,
};

export default function BadgeDisplay() {
    const { state } = useGamification();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Your Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BADGES.map((badge) => {
                    const isUnlocked = state.badges.includes(badge.id);
                    const IconComponent = ICON_MAP[badge.icon] || HelpCircle;

                    return (
                        <div
                            key={badge.id}
                            className={`group relative p-4 rounded-lg border text-center transition-all duration-300 ${isUnlocked
                                ? 'border-blue-100 bg-blue-50/50 hover:shadow-md hover:border-blue-200'
                                : 'border-gray-100 bg-gray-50 opacity-60 grayscale'
                                }`}
                        >
                            <div className="flex justify-center mb-2 transition-transform group-hover:scale-110 duration-300">
                                <IconComponent
                                    size={36}
                                    className={`${isUnlocked ? 'text-primary' : 'text-gray-400'}`}
                                    strokeWidth={isUnlocked ? 2 : 1.5}
                                />
                            </div>
                            <h4 className={`font-semibold text-sm mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                {badge.name}
                            </h4>

                            {/* Tooltip */}
                            <div className="absolute inset-0 bg-black/80 text-white text-xs p-2 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                {badge.description}
                                {!isUnlocked && " (Locked)"}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
