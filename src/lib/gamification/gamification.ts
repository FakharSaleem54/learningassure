export type Level = "Beginner" | "Explorer" | "Achiever" | "Expert";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji for this demo
    condition: (state: GamificationState) => boolean;
}

export interface GamificationState {
    points: number;
    level: Level;
    badges: string[]; // IDs of unlocked badges
    completedCourses: number;
    quizzesPassed: number;
    loginStreak: number; // Mocked for now
}

export const POINTS_CONFIG = {
    COURSE_COMPLETION: 50,
    QUIZ_PASS: 20,
    DAILY_LOGIN: 10,
    FORUM_POST: 5,
};

export const LEVEL_THRESHOLDS = {
    Beginner: 0,
    Explorer: 100,
    Achiever: 300,
    Expert: 600,
};

export const BADGES: Badge[] = [
    {
        id: "first_steps",
        name: "First Steps",
        description: "Earn your first 10 points",
        icon: "Sprout",
        condition: (state) => state.points >= 10,
    },
    {
        id: "course_finisher",
        name: "Course Finisher",
        description: "Complete your first course",
        icon: "GraduationCap",
        condition: (state) => state.completedCourses >= 1,
    },
    {
        id: "quiz_whiz",
        name: "Quiz Whiz",
        description: "Pass a quiz",
        icon: "Brain",
        condition: (state) => state.quizzesPassed >= 1,
    },
    {
        id: "high_flyer",
        name: "High Flyer",
        description: "Reach the Achiever level",
        icon: "Rocket",
        condition: (state) => state.level === "Achiever" || state.level === "Expert",
    },
];

export function calculateLevel(points: number): Level {
    if (points >= LEVEL_THRESHOLDS.Expert) return "Expert";
    if (points >= LEVEL_THRESHOLDS.Achiever) return "Achiever";
    if (points >= LEVEL_THRESHOLDS.Explorer) return "Explorer";
    return "Beginner";
}

export function getLevelProgress(points: number): number {
    let currentBase = 0;
    let nextThreshold = LEVEL_THRESHOLDS.Explorer;

    if (points >= LEVEL_THRESHOLDS.Expert) return 100;

    if (points >= LEVEL_THRESHOLDS.Achiever) {
        currentBase = LEVEL_THRESHOLDS.Achiever;
        nextThreshold = LEVEL_THRESHOLDS.Expert;
    } else if (points >= LEVEL_THRESHOLDS.Explorer) {
        currentBase = LEVEL_THRESHOLDS.Explorer;
        nextThreshold = LEVEL_THRESHOLDS.Achiever;
    } else {
        currentBase = LEVEL_THRESHOLDS.Beginner;
        nextThreshold = LEVEL_THRESHOLDS.Explorer;
    }

    const progress = ((points - currentBase) / (nextThreshold - currentBase)) * 100;
    return Math.min(100, Math.max(0, progress));
}
