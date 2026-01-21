import {
    GamificationState,
    POINTS_CONFIG,
    calculateLevel,
    BADGES,
    Badge
} from './gamification';

const STORAGE_KEY = 'learning_assure_gamification';

const DEFAULT_STATE: GamificationState = {
    points: 0,
    level: "Beginner",
    badges: [],
    completedCourses: 0,
    quizzesPassed: 0,
    loginStreak: 1,
};

export type ActionType = keyof typeof POINTS_CONFIG;

export interface PointAward {
    pointsAdded: number;
    newLevel: boolean;
    newBadges: Badge[];
}

export const GamificationStorage = {
    getState: (): GamificationState => {
        if (typeof window === 'undefined') return DEFAULT_STATE;
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_STATE;
    },

    saveState: (state: GamificationState) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    awardPoints: (action: ActionType): PointAward | null => {
        const currentState = GamificationStorage.getState();
        const pointsToAdd = POINTS_CONFIG[action];

        if (!pointsToAdd) return null;

        const newState = { ...currentState };
        newState.points += pointsToAdd;

        // Update specific metrics based on action
        if (action === 'COURSE_COMPLETION') newState.completedCourses++;
        if (action === 'QUIZ_PASS') newState.quizzesPassed++;

        // Check Level
        const newLevel = calculateLevel(newState.points);
        const levelUp = newLevel !== newState.level;
        newState.level = newLevel;

        // Check Badges
        const newlyUnlocked: Badge[] = [];
        BADGES.forEach(badge => {
            if (!newState.badges.includes(badge.id) && badge.condition(newState)) {
                newState.badges.push(badge.id);
                newlyUnlocked.push(badge);
            }
        });

        GamificationStorage.saveState(newState);

        return {
            pointsAdded: pointsToAdd,
            newLevel: levelUp,
            newBadges: newlyUnlocked
        };
    },

    // Mock Leadboard Data
    getLeaderboard: () => {
        return [
            { id: 1, name: "Alice Johnson", points: 850, level: "Expert" },
            { id: 2, name: "Bob Smith", points: 720, level: "Expert" },
            { id: 3, name: "Charlie Brown", points: 540, level: "Achiever" },
            { id: 4, name: "Diana Prince", points: 490, level: "Achiever" },
            { id: 5, name: "Evan Wright", points: 310, level: "Achiever" },
            { id: 6, name: "Fiona Gallagher", points: 280, level: "Explorer" },
            { id: 7, name: "George Martin", points: 150, level: "Explorer" },
            { id: 8, name: "Hannah Lee", points: 120, level: "Explorer" },
            { id: 9, name: "Ian Somerhalder", points: 90, level: "Beginner" },
            { id: 10, name: "Julia Roberts", points: 45, level: "Beginner" },
        ];
    }
};
