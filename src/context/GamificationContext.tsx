"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { GamificationState, Badge } from '@/lib/gamification/gamification';
import { GamificationStorage, ActionType } from '@/lib/gamification/gamification-storage';
import PointsPopup from '@/components/gamification/PointsPopup';

interface GamificationContextType {
    state: GamificationState;
    awardPoints: (action: ActionType) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<GamificationState>(GamificationStorage.getState());
    const [popup, setPopup] = useState<{ points: number; message: string } | null>(null);

    useEffect(() => {
        // Sync with local storage on mount (handling potential hydration mismatches if needed, script runs on client)
        setState(GamificationStorage.getState());
    }, []);

    const awardPoints = (action: ActionType) => {
        const result = GamificationStorage.awardPoints(action);
        if (result) {
            // Update local state to trigger re-renders
            setState(GamificationStorage.getState());

            // Show popup
            let message = `+${result.pointsAdded} Points!`;
            if (result.newLevel) message += " & Level Up!";
            if (result.newBadges.length > 0) message += " & New Badge!";

            setPopup({ points: result.pointsAdded, message });

            // Auto dismiss
            setTimeout(() => setPopup(null), 3000);
        }
    };

    return (
        <GamificationContext.Provider value={{ state, awardPoints }}>
            {children}
            {popup && (
                <PointsPopup
                    points={popup.points}
                    message={popup.message}
                    onClose={() => setPopup(null)}
                />
            )}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}
