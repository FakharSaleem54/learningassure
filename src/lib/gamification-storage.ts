// ============================================================
// Gamification Storage - LocalStorage Persistence
// ============================================================

import {
    UserGamificationStats,
    PointAction,
    PointEvent,
    BadgeId,
    POINT_VALUES,
    getDefaultStats,
    checkNewBadges,
} from './gamification';

const STORAGE_KEY = 'learning_assure_gamification';

/**
 * Get user gamification stats from localStorage
 */
export function getGamificationStats(): UserGamificationStats {
    if (typeof window === 'undefined') {
        return getDefaultStats();
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as UserGamificationStats;
        }
    } catch (error) {
        console.error('Error reading gamification stats:', error);
    }

    return getDefaultStats();
}

/**
 * Save user gamification stats to localStorage
 */
export function saveGamificationStats(stats: UserGamificationStats): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
        console.error('Error saving gamification stats:', error);
    }
}

/**
 * Award points for an action and update stats
 * Returns newly unlocked badges if any
 */
export function awardPoints(
    action: PointAction,
    description?: string
): { points: number; newBadges: BadgeId[] } {
    const stats = getGamificationStats();
    const points = POINT_VALUES[action];

    // Create point event
    const event: PointEvent = {
        action,
        points,
        timestamp: Date.now(),
        description,
    };

    // Update stats
    stats.totalPoints += points;
    stats.pointsHistory.push(event);

    // Update action-specific counters
    switch (action) {
        case 'COURSE_ENROLLMENT':
            stats.coursesEnrolled++;
            break;
        case 'LESSON_COMPLETED':
            stats.lessonsCompleted++;
            break;
        case 'QUIZ_PASSED':
            stats.quizzesPassed++;
            break;
        case 'QUIZ_FIRST_ATTEMPT_BONUS':
            stats.firstAttemptPasses++;
            break;
        case 'COURSE_COMPLETED':
            stats.coursesCompleted++;
            break;
        case 'FORUM_POST':
            stats.forumPosts++;
            break;
        case 'FORUM_REPLY':
            stats.forumReplies++;
            break;
        case 'HELPFUL_ANSWER':
            stats.helpfulAnswers++;
            break;
    }

    // Check for new badges
    const newBadges = checkNewBadges(stats);
    stats.unlockedBadges = [...stats.unlockedBadges, ...newBadges];

    // Save updated stats
    saveGamificationStats(stats);

    return { points, newBadges };
}

/**
 * Reset gamification stats (for testing)
 */
export function resetGamificationStats(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

// ===== MOCK LEADERBOARD DATA =====
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    points: number;
    level: number;
    levelTitle: string;
    isCurrentUser?: boolean;
}

/**
 * Get mock leaderboard data
 */
export function getMockLeaderboard(currentUserName?: string): LeaderboardEntry[] {
    const mockUsers: LeaderboardEntry[] = [
        { rank: 1, userId: '1', name: 'Sarah Ahmed', points: 1250, level: 4, levelTitle: 'Expert' },
        { rank: 2, userId: '2', name: 'Ali Khan', points: 980, level: 4, levelTitle: 'Expert' },
        { rank: 3, userId: '3', name: 'Fatima Zahra', points: 845, level: 4, levelTitle: 'Expert' },
        { rank: 4, userId: '4', name: 'Hassan Raza', points: 720, level: 4, levelTitle: 'Expert' },
        { rank: 5, userId: '5', name: 'Ayesha Malik', points: 560, level: 4, levelTitle: 'Expert' },
        { rank: 6, userId: '6', name: 'Omar Farooq', points: 420, level: 4, levelTitle: 'Expert' },
        { rank: 7, userId: '7', name: 'Zainab Ali', points: 290, level: 3, levelTitle: 'Achiever' },
        { rank: 8, userId: '8', name: 'Bilal Hussain', points: 185, level: 3, levelTitle: 'Achiever' },
        { rank: 9, userId: '9', name: 'Mariam Noor', points: 120, level: 2, levelTitle: 'Explorer' },
        { rank: 10, userId: '10', name: 'Usman Tariq', points: 75, level: 2, levelTitle: 'Explorer' },
    ];

    // If current user name provided, find and mark them
    if (currentUserName) {
        const currentUserStats = getGamificationStats();

        // Insert current user into the leaderboard at the right position
        const currentUserEntry: LeaderboardEntry = {
            rank: 0,
            userId: 'current',
            name: currentUserName,
            points: currentUserStats.totalPoints,
            level: 1,
            levelTitle: 'Beginner',
            isCurrentUser: true,
        };

        // Calculate level from points
        if (currentUserStats.totalPoints >= 300) {
            currentUserEntry.level = 4;
            currentUserEntry.levelTitle = 'Expert';
        } else if (currentUserStats.totalPoints >= 150) {
            currentUserEntry.level = 3;
            currentUserEntry.levelTitle = 'Achiever';
        } else if (currentUserStats.totalPoints >= 50) {
            currentUserEntry.level = 2;
            currentUserEntry.levelTitle = 'Explorer';
        }

        // Find the right position for current user
        let insertIndex = mockUsers.findIndex(u => u.points < currentUserStats.totalPoints);
        if (insertIndex === -1) insertIndex = mockUsers.length;

        mockUsers.splice(insertIndex, 0, currentUserEntry);

        // Update ranks
        mockUsers.forEach((user, index) => {
            user.rank = index + 1;
        });

        // Keep only top 10
        return mockUsers.slice(0, 10);
    }

    return mockUsers;
}
