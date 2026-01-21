// ============================================================
// Gamification System Configuration
// Points, Badges, Levels - Core constants and utilities
// ============================================================

// ===== POINT VALUES =====
export const POINT_VALUES = {
    COURSE_ENROLLMENT: 10,
    LESSON_COMPLETED: 5,
    QUIZ_PASSED: 20,
    QUIZ_FIRST_ATTEMPT_BONUS: 10,
    COURSE_COMPLETED: 50,
    FORUM_POST: 5,
    FORUM_REPLY: 3,
    HELPFUL_ANSWER: 5,
} as const;

export type PointAction = keyof typeof POINT_VALUES;

// ===== LEVEL THRESHOLDS =====
export const LEVELS = [
    { level: 1, title: 'Beginner', minPoints: 0, maxPoints: 49, color: '#94a3b8' },
    { level: 2, title: 'Explorer', minPoints: 50, maxPoints: 149, color: '#4169E1' },
    { level: 3, title: 'Achiever', minPoints: 150, maxPoints: 299, color: '#FF6B35' },
    { level: 4, title: 'Expert', minPoints: 300, maxPoints: Infinity, color: '#059669' },
] as const;

export type Level = typeof LEVELS[number];

// ===== BADGE DEFINITIONS =====
export const BADGES = {
    FIRST_COURSE: {
        id: 'first_course',
        name: 'First Course Completed',
        description: 'Complete your first course',
        icon: '🎓',
        condition: (stats: UserGamificationStats) => stats.coursesCompleted >= 1,
    },
    QUIZ_MASTER: {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Pass 5 quizzes',
        icon: '🏆',
        condition: (stats: UserGamificationStats) => stats.quizzesPassed >= 5,
    },
    ACTIVE_LEARNER: {
        id: 'active_learner',
        name: 'Active Learner',
        description: 'Complete 10 lessons',
        icon: '📚',
        condition: (stats: UserGamificationStats) => stats.lessonsCompleted >= 10,
    },
    HELPFUL_CONTRIBUTOR: {
        id: 'helpful_contributor',
        name: 'Helpful Contributor',
        description: 'Receive 5 upvotes on your answers',
        icon: '🤝',
        condition: (stats: UserGamificationStats) => stats.helpfulAnswers >= 5,
    },
    DISCUSSION_STARTER: {
        id: 'discussion_starter',
        name: 'Discussion Starter',
        description: 'Create 3 forum posts',
        icon: '💬',
        condition: (stats: UserGamificationStats) => stats.forumPosts >= 3,
    },
    PERFECT_SCORE: {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Pass a quiz on the first attempt',
        icon: '⭐',
        condition: (stats: UserGamificationStats) => stats.firstAttemptPasses >= 1,
    },
    ENROLLED_EXPLORER: {
        id: 'enrolled_explorer',
        name: 'Enrolled Explorer',
        description: 'Enroll in 3 courses',
        icon: '🧭',
        condition: (stats: UserGamificationStats) => stats.coursesEnrolled >= 3,
    },
    COMMUNITY_MEMBER: {
        id: 'community_member',
        name: 'Community Member',
        description: 'Make 10 forum replies',
        icon: '👥',
        condition: (stats: UserGamificationStats) => stats.forumReplies >= 10,
    },
} as const;

export type BadgeId = keyof typeof BADGES;
export type Badge = typeof BADGES[BadgeId];

// ===== USER STATS INTERFACE =====
export interface UserGamificationStats {
    totalPoints: number;
    coursesEnrolled: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    quizzesPassed: number;
    firstAttemptPasses: number;
    forumPosts: number;
    forumReplies: number;
    helpfulAnswers: number;
    unlockedBadges: BadgeId[];
    pointsHistory: PointEvent[];
}

export interface PointEvent {
    action: PointAction;
    points: number;
    timestamp: number;
    description?: string;
}

// ===== HELPER FUNCTIONS =====

/**
 * Get the current level based on total points
 */
export function getCurrentLevel(points: number): Level {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (points >= LEVELS[i].minPoints) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

/**
 * Get progress percentage towards the next level
 */
export function getLevelProgress(points: number): number {
    const currentLevel = getCurrentLevel(points);
    const levelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);

    // If max level, return 100%
    if (levelIndex === LEVELS.length - 1) {
        return 100;
    }

    const nextLevel = LEVELS[levelIndex + 1];
    const pointsInLevel = points - currentLevel.minPoints;
    const levelRange = nextLevel.minPoints - currentLevel.minPoints;

    return Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
}

/**
 * Get points needed to reach the next level
 */
export function getPointsToNextLevel(points: number): number {
    const currentLevel = getCurrentLevel(points);
    const levelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);

    // If max level, return 0
    if (levelIndex === LEVELS.length - 1) {
        return 0;
    }

    const nextLevel = LEVELS[levelIndex + 1];
    return nextLevel.minPoints - points;
}

/**
 * Check which badges should be unlocked based on current stats
 */
export function checkNewBadges(stats: UserGamificationStats): BadgeId[] {
    const newBadges: BadgeId[] = [];

    for (const [id, badge] of Object.entries(BADGES)) {
        const badgeId = id as BadgeId;
        if (!stats.unlockedBadges.includes(badgeId) && badge.condition(stats)) {
            newBadges.push(badgeId);
        }
    }

    return newBadges;
}

/**
 * Get the default empty stats object
 */
export function getDefaultStats(): UserGamificationStats {
    return {
        totalPoints: 0,
        coursesEnrolled: 0,
        coursesCompleted: 0,
        lessonsCompleted: 0,
        quizzesPassed: 0,
        firstAttemptPasses: 0,
        forumPosts: 0,
        forumReplies: 0,
        helpfulAnswers: 0,
        unlockedBadges: [],
        pointsHistory: [],
    };
}
